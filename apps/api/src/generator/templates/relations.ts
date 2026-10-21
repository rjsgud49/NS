import { EntityConfig, RelationType } from '@ns/shared';

export interface ResolvedRelation {
  type: RelationType;
  target: string;
  fieldName: string;
  /** The other side of this relation, when the schema has one. */
  inverseField?: string;
  relationName: string;
  /** Prisma foreign key. Set for many-to-one. */
  fkName?: string;
  generated: boolean;
}

interface MutableRelation {
  type: RelationType;
  target: string;
  fieldName: string;
  inverseField?: string;
  relationName?: string;
  fkName?: string;
  generated: boolean;
  paired: boolean;
}

/**
 * Relations need a real property on the other model.
 * Prisma rejects every relation that lacks an opposite field.
 * TypeORM rejects OneToMany whose inverse property does not exist, and a guessed name fails typecheck.
 * ManyToOne and ManyToMany can stand alone in TypeORM, so those inverses are added only for Prisma.
 * A single relation in each direction is one relation. Anything else stays separate so two different links are not merged.
 */
export function resolveRelations(
  entities: EntityConfig[],
  orm: 'typeorm' | 'prisma',
): Map<string, ResolvedRelation[]> {
  const byName = new Map<string, MutableRelation[]>();
  const entityByName = new Map(entities.map((entity) => [entity.name, entity]));

  for (const entity of entities) {
    byName.set(
      entity.name,
      (entity.relations ?? []).map((relation) => ({
        type: relation.type,
        target: relation.target,
        fieldName: relation.fieldName,
        generated: false,
        paired: false,
      })),
    );
  }

  pairRelations(entities, byName);

  for (const entity of entities) {
    for (const relation of byName.get(entity.name) ?? []) {
      if (relation.paired || !entityByName.has(relation.target)) continue;
      if (relation.type === 'one-to-many') {
        addInverseManyToOne(entity, relation, byName, entityByName);
      } else if (orm === 'prisma') {
        addInverseArray(entity, relation, byName, entityByName);
      }
    }
  }

  assignForeignKeys(entities, byName);
  assignRelationNames(byName);

  return new Map(
    [...byName].map(([name, relations]) => [
      name,
      relations.map((relation) => ({
        type: relation.type,
        target: relation.target,
        fieldName: relation.fieldName,
        inverseField: relation.inverseField,
        relationName: relation.relationName ?? '',
        fkName: relation.fkName,
        generated: relation.generated,
      })),
    ]),
  );
}

function pairRelations(entities: EntityConfig[], byName: Map<string, MutableRelation[]>) {
  const names = entities.map((entity) => entity.name);
  for (let i = 0; i < names.length; i++) {
    for (let j = i; j < names.length; j++) {
      pairOneToMany(names[i], names[j], byName);
      pairManyToMany(names[i], names[j], byName);
    }
  }
}

function pairOneToMany(left: string, right: string, byName: Map<string, MutableRelation[]>) {
  if (left === right) {
    linkIfUnique(
      unmatched(byName, left, left, 'many-to-one'),
      unmatched(byName, left, left, 'one-to-many'),
    );
    return;
  }
  linkIfUnique(
    unmatched(byName, left, right, 'many-to-one'),
    unmatched(byName, right, left, 'one-to-many'),
  );
  linkIfUnique(
    unmatched(byName, right, left, 'many-to-one'),
    unmatched(byName, left, right, 'one-to-many'),
  );
}

function pairManyToMany(left: string, right: string, byName: Map<string, MutableRelation[]>) {
  if (left === right) {
    const fields = unmatched(byName, left, left, 'many-to-many');
    if (fields.length === 2) link(fields[0], fields[1]);
    return;
  }
  linkIfUnique(
    unmatched(byName, left, right, 'many-to-many'),
    unmatched(byName, right, left, 'many-to-many'),
  );
}

function unmatched(
  byName: Map<string, MutableRelation[]>,
  owner: string,
  target: string,
  type: RelationType,
): MutableRelation[] {
  return (byName.get(owner) ?? []).filter(
    (relation) => relation.target === target && relation.type === type && !relation.paired,
  );
}

function linkIfUnique(forward: MutableRelation[], back: MutableRelation[]) {
  if (forward.length === 1 && back.length === 1) link(forward[0], back[0]);
}

function link(forward: MutableRelation, back: MutableRelation) {
  forward.inverseField = back.fieldName;
  back.inverseField = forward.fieldName;
  forward.paired = true;
  back.paired = true;
}

function addInverseArray(
  source: EntityConfig,
  relation: MutableRelation,
  byName: Map<string, MutableRelation[]>,
  entityByName: Map<string, EntityConfig>,
) {
  const target = entityByName.get(relation.target);
  if (!target) return;
  const used = usedNames(target, byName);
  const pluralSource = plural(toCamel(source.name));
  const fieldName = uniqueName(used, [
    pluralSource,
    `${relation.fieldName}${toPascal(pluralSource)}`,
  ]);
  const inverse: MutableRelation = {
    type: relation.type === 'many-to-many' ? 'many-to-many' : 'one-to-many',
    target: source.name,
    fieldName,
    inverseField: relation.fieldName,
    generated: true,
    paired: true,
  };
  relation.inverseField = fieldName;
  relation.paired = true;
  byName.get(target.name)?.push(inverse);
}

function addInverseManyToOne(
  source: EntityConfig,
  relation: MutableRelation,
  byName: Map<string, MutableRelation[]>,
  entityByName: Map<string, EntityConfig>,
) {
  const target = entityByName.get(relation.target);
  if (!target) return;
  const used = usedNames(target, byName);
  const fieldName = uniqueManyToOneName(used, [
    toCamel(source.name),
    `${toCamel(source.name)}${toPascal(relation.fieldName)}`,
    `${toCamel(source.name)}Ref`,
  ]);
  const inverse: MutableRelation = {
    type: 'many-to-one',
    target: source.name,
    fieldName,
    inverseField: relation.fieldName,
    generated: true,
    paired: true,
  };
  relation.inverseField = fieldName;
  relation.paired = true;
  byName.get(target.name)?.push(inverse);
}

function usedNames(entity: EntityConfig, byName: Map<string, MutableRelation[]>): Set<string> {
  const used = new Set<string>(['id', 'createdAt', 'updatedAt']);
  for (const field of entity.fields) used.add(field.name);
  for (const relation of byName.get(entity.name) ?? []) {
    used.add(relation.fieldName);
    if (relation.type === 'many-to-one') used.add(relation.fkName ?? `${relation.fieldName}Id`);
  }
  return used;
}

function assignForeignKeys(entities: EntityConfig[], byName: Map<string, MutableRelation[]>) {
  for (const entity of entities) {
    const used = new Set<string>(['id', 'createdAt', 'updatedAt']);
    for (const field of entity.fields) used.add(field.name);
    for (const relation of byName.get(entity.name) ?? []) used.add(relation.fieldName);

    for (const relation of byName.get(entity.name) ?? []) {
      if (relation.type !== 'many-to-one') continue;
      const base = relation.fieldName;
      const candidates = [`${base}Id`, `${base}RefId`, `${base}Key`];
      let fk = candidates.find((name) => name.length <= 64 && !used.has(name));
      if (!fk) {
        let index = 2;
        while (used.has(`${base}${index}Id`)) index += 1;
        fk = `${base}${index}Id`;
      }
      relation.fkName = fk;
      used.add(fk);
    }
  }
}

function assignRelationNames(byName: Map<string, MutableRelation[]>) {
  const seen = new Set<string>();
  for (const [owner, relations] of byName) {
    for (const relation of relations) {
      if (relation.relationName) continue;
      const inverseName = relation.inverseField ?? 'side';
      let name = `${toPascal(owner)}_${relation.fieldName}_${toPascal(relation.target)}_${inverseName}`;
      if (seen.has(name)) {
        let index = 2;
        while (seen.has(`${name}_${index}`)) index += 1;
        name = `${name}_${index}`;
      }
      seen.add(name);
      relation.relationName = name;
      const other = (byName.get(relation.target) ?? []).find(
        (candidate) =>
          candidate !== relation &&
          !candidate.relationName &&
          candidate.target === owner &&
          candidate.fieldName === relation.inverseField,
      );
      if (other) other.relationName = name;
    }
  }
}

function uniqueName(used: Set<string>, bases: string[]): string {
  return pickName(used, bases, () => false);
}

function uniqueManyToOneName(used: Set<string>, bases: string[]): string {
  return pickName(used, bases, (name) => used.has(`${name}Id`.slice(0, 64)));
}

function pickName(used: Set<string>, bases: string[], blocked: (name: string) => boolean): string {
  const candidates = [...bases];
  for (const base of bases) {
    for (let index = 2; index <= 30; index += 1) candidates.push(`${base}${index}`);
  }
  for (const candidate of candidates) {
    const name = candidate.slice(0, 64);
    if (/^[A-Za-z]/.test(name) && !used.has(name) && !blocked(name)) return name;
  }
  throw new Error('관계 필드 이름을 만들지 못했습니다.');
}

function plural(name: string): string {
  if (/(?:s|x|z|ch|sh)$/i.test(name)) return `${name}es`;
  if (/[^aeiou]y$/i.test(name)) return `${name.slice(0, -1)}ies`;
  return `${name}s`;
}

function toPascal(value: string): string {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

function toCamel(value: string): string {
  return value.charAt(0).toLowerCase() + value.slice(1);
}
