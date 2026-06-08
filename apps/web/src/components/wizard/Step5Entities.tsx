'use client';

import { useState } from 'react';
import { ProjectConfig, EntityConfig, FieldConfig, FieldType, RelationConfig, RelationType } from '@ns/shared';
import { ENTITY_PRESETS } from '@/lib/entity-presets';

interface Props { config: ProjectConfig; update: (p: Partial<ProjectConfig>) => void; }

const FIELD_TYPES: { value: FieldType; label: string }[] = [
  { value: 'string', label: 'string' },
  { value: 'number', label: 'number (int)' },
  { value: 'float', label: 'float' },
  { value: 'boolean', label: 'boolean' },
  { value: 'date', label: 'date' },
  { value: 'text', label: 'text (long)' },
  { value: 'json', label: 'json' },
];

const RELATION_TYPES: { value: RelationType; label: string; desc: string }[] = [
  { value: 'one-to-many', label: '1 : N', desc: '이 엔티티가 여러 개를 가짐 (예: User → Posts)' },
  { value: 'many-to-one', label: 'N : 1', desc: '이 엔티티가 하나에 속함 (예: Post → User)' },
  { value: 'many-to-many', label: 'N : M', desc: '서로 여러 개 참조 (예: Post ↔ Tag)' },
];

const RELATION_BADGE: Record<RelationType, string> = {
  'one-to-many': 'bg-blue-500/15 text-blue-400',
  'many-to-one': 'bg-orange-500/15 text-orange-400',
  'many-to-many': 'bg-purple-500/15 text-purple-400',
};

const emptyField = (): FieldConfig => ({
  name: '', type: 'string', isUnique: false, isOptional: false, isArray: false,
});

function defaultFieldName(type: RelationType, target: string): string {
  const camel = target.charAt(0).toLowerCase() + target.slice(1);
  if (type === 'one-to-many' || type === 'many-to-many') return camel + 's';
  return camel;
}

export function Step5Entities({ config, update }: Props) {
  const [newEntityName, setNewEntityName] = useState('');
  const [showPresets, setShowPresets] = useState(true);
  const [addingRelation, setAddingRelation] = useState<number | null>(null);
  const [newRelation, setNewRelation] = useState<RelationConfig>({
    type: 'many-to-one', target: '', fieldName: '',
  });

  const setEntities = (entities: EntityConfig[]) => update({ entities });

  const addEntity = (entity?: EntityConfig) => {
    const base = entity ? structuredClone(entity) : { name: newEntityName.trim(), fields: [], relations: [] };
    if (!base.name) return;
    if (config.entities.some((e) => e.name === base.name)) return;
    setEntities([...config.entities, base]);
    setNewEntityName('');
  };

  const removeEntity = (idx: number) =>
    setEntities(config.entities.filter((_, i) => i !== idx));

  const renameEntity = (idx: number, name: string) =>
    setEntities(config.entities.map((e, i) => (i === idx ? { ...e, name } : e)));

  const addField = (ei: number) =>
    setEntities(config.entities.map((e, i) => i === ei ? { ...e, fields: [...e.fields, emptyField()] } : e));

  const updateField = (ei: number, fi: number, patch: Partial<FieldConfig>) =>
    setEntities(config.entities.map((e, i) =>
      i !== ei ? e : { ...e, fields: e.fields.map((f, j) => j === fi ? { ...f, ...patch } : f) }
    ));

  const removeField = (ei: number, fi: number) =>
    setEntities(config.entities.map((e, i) =>
      i !== ei ? e : { ...e, fields: e.fields.filter((_, j) => j !== fi) }
    ));

  // ── Relations ──
  const openAddRelation = (ei: number) => {
    const otherEntities = config.entities.filter((_, i) => i !== ei);
    const firstTarget = otherEntities[0]?.name ?? '';
    const type: RelationType = 'many-to-one';
    setNewRelation({ type, target: firstTarget, fieldName: defaultFieldName(type, firstTarget) });
    setAddingRelation(ei);
  };

  const confirmRelation = (ei: number) => {
    if (!newRelation.target || !newRelation.fieldName) return;
    setEntities(config.entities.map((e, i) =>
      i !== ei ? e : { ...e, relations: [...(e.relations ?? []), { ...newRelation }] }
    ));
    setAddingRelation(null);
  };

  const removeRelation = (ei: number, ri: number) =>
    setEntities(config.entities.map((e, i) =>
      i !== ei ? e : { ...e, relations: (e.relations ?? []).filter((_, j) => j !== ri) }
    ));

  const isPresetAdded = (key: string) =>
    config.entities.some((e) => e.name === ENTITY_PRESETS.find((p) => p.key === key)?.entity.name);

  const otherEntitiesFor = (ei: number) => config.entities.filter((_, i) => i !== ei);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold">엔티티 / CRUD 설정</h2>
        <p className="text-gray-400 text-sm mt-1">모델을 추가하면 entity · DTO · service · controller · module이 자동 생성됩니다.</p>
      </div>

      {/* ── 프리셋 ── */}
      <div className="space-y-3">
        <button
          onClick={() => setShowPresets(!showPresets)}
          className="flex items-center gap-2 text-sm font-medium text-gray-300 hover:text-white transition-colors"
        >
          <span className={`text-gray-600 transition-transform inline-block ${showPresets ? 'rotate-90' : ''}`}>▶</span>
          예시 엔티티 불러오기
          <span className="text-xs text-gray-600 font-normal">({ENTITY_PRESETS.length}개 프리셋)</span>
        </button>

        {showPresets && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {ENTITY_PRESETS.map((preset) => {
              const added = isPresetAdded(preset.key);
              return (
                <button
                  key={preset.key}
                  onClick={() => !added && addEntity(preset.entity)}
                  disabled={added}
                  title={preset.description}
                  className={`group relative p-3 rounded-xl border text-left transition-all
                    ${added ? 'border-brand-500/40 bg-brand-500/10 cursor-default'
                      : 'border-gray-700 bg-gray-800/50 hover:border-brand-500 hover:bg-brand-500/10 cursor-pointer'}`}
                >
                  <div className="text-xl mb-1">{preset.icon}</div>
                  <div className="text-xs font-semibold text-gray-200">{preset.label}</div>
                  <div className="text-[10px] text-gray-500 mt-0.5 leading-tight">{preset.description}</div>
                  {added && (
                    <div className="absolute top-2 right-2 w-4 h-4 rounded-full bg-brand-500 flex items-center justify-center">
                      <span className="text-[8px] text-white font-bold">✓</span>
                    </div>
                  )}
                  {!added && (
                    <div className="absolute left-0 top-full mt-1 z-10 hidden group-hover:block bg-gray-900 border border-gray-700 rounded-lg p-2 w-44 shadow-xl">
                      <p className="text-[10px] text-gray-500 mb-1 font-medium">자동 생성 필드</p>
                      <ul className="space-y-0.5">
                        {preset.entity.fields.map((f) => (
                          <li key={f.name} className="text-[10px] font-mono text-gray-400 flex justify-between">
                            <span>{f.name}</span><span className="text-gray-600">{f.type}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        )}
      </div>

      <div className="border-t border-gray-800" />

      {/* ── 직접 추가 ── */}
      <div className="flex gap-2">
        <input
          value={newEntityName}
          onChange={(e) => setNewEntityName(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && addEntity()}
          placeholder="새 엔티티 이름 (예: Post, User)"
          className="flex-1 bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-100
            focus:outline-none focus:ring-2 focus:ring-brand-500 placeholder:text-gray-600"
        />
        <button
          onClick={() => addEntity()}
          className="px-4 py-2 bg-brand-500 hover:bg-brand-600 text-white rounded-lg text-sm font-medium transition-colors"
        >추가</button>
      </div>

      {/* ── 엔티티 목록 ── */}
      {config.entities.length === 0 ? (
        <div className="text-center py-10 text-gray-600 border border-dashed border-gray-800 rounded-xl">
          <p className="text-sm">엔티티가 없습니다.</p>
          <p className="text-xs mt-1">프리셋에서 불러오거나 직접 입력해서 추가하세요.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {config.entities.map((entity, ei) => {
            const relations = entity.relations ?? [];
            const others = otherEntitiesFor(ei);
            return (
              <div key={ei} className="border border-gray-700 rounded-xl overflow-visible">
                {/* Header */}
                <div className="flex items-center gap-2 px-4 py-3 bg-gray-800 rounded-t-xl">
                  <input
                    value={entity.name}
                    onChange={(e) => renameEntity(ei, e.target.value)}
                    className="font-mono text-sm font-semibold text-brand-400 bg-transparent border-b border-transparent
                      hover:border-gray-600 focus:border-brand-500 focus:outline-none px-0.5 w-40"
                  />
                  <span className="text-gray-600 text-xs">Entity</span>
                  <span className="ml-auto text-xs text-gray-600">{entity.fields.length}필드 · {relations.length}관계</span>
                  <button onClick={() => removeEntity(ei)} className="text-gray-600 hover:text-red-400 text-xs ml-2 transition-colors">삭제</button>
                </div>

                <div className="p-4 space-y-4">
                  {/* Fields */}
                  <div className="space-y-2">
                    <p className="text-[10px] text-gray-600 font-mono">id (PK · auto) · createdAt · updatedAt — 자동 포함</p>

                    {entity.fields.length > 0 && (
                      <div className="grid grid-cols-[1fr_110px_60px_60px_20px] gap-x-2 mb-1">
                        {['필드명', '타입', 'optional', 'unique', ''].map((h) => (
                          <span key={h} className="text-[10px] text-gray-600 font-medium px-1">{h}</span>
                        ))}
                      </div>
                    )}

                    {entity.fields.map((field, fi) => (
                      <div key={fi} className="grid grid-cols-[1fr_110px_60px_60px_20px] gap-x-2 items-center">
                        <input
                          value={field.name}
                          onChange={(e) => updateField(ei, fi, { name: e.target.value })}
                          placeholder="fieldName"
                          className="bg-gray-800 border border-gray-700 rounded-md px-2 py-1.5 text-xs text-gray-100
                            font-mono focus:outline-none focus:ring-1 focus:ring-brand-500 w-full"
                        />
                        <select
                          value={field.type}
                          onChange={(e) => updateField(ei, fi, { type: e.target.value as FieldType })}
                          className="bg-gray-800 border border-gray-700 rounded-md px-1.5 py-1.5 text-xs text-gray-100
                            focus:outline-none focus:ring-1 focus:ring-brand-500"
                        >
                          {FIELD_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
                        </select>
                        <label className="flex items-center justify-center cursor-pointer">
                          <input type="checkbox" checked={field.isOptional}
                            onChange={(e) => updateField(ei, fi, { isOptional: e.target.checked })}
                            className="accent-brand-500 w-3.5 h-3.5" />
                        </label>
                        <label className="flex items-center justify-center cursor-pointer">
                          <input type="checkbox" checked={field.isUnique}
                            onChange={(e) => updateField(ei, fi, { isUnique: e.target.checked })}
                            className="accent-brand-500 w-3.5 h-3.5" />
                        </label>
                        <button onClick={() => removeField(ei, fi)}
                          className="text-gray-700 hover:text-red-400 text-sm transition-colors">✕</button>
                      </div>
                    ))}

                    <button onClick={() => addField(ei)}
                      className="w-full py-1.5 border border-dashed border-gray-700 rounded-lg text-xs text-gray-500
                        hover:border-brand-500 hover:text-brand-500 transition-colors">
                      + 필드 추가
                    </button>
                  </div>

                  {/* ── Relations ── */}
                  <div className="border-t border-gray-800 pt-3 space-y-2">
                    <p className="text-xs font-medium text-gray-400">관계 설정</p>

                    {relations.length > 0 && (
                      <div className="space-y-1.5">
                        {relations.map((rel, ri) => (
                          <div key={ri} className="flex items-center gap-2 bg-gray-800/60 rounded-lg px-3 py-2">
                            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${RELATION_BADGE[rel.type]}`}>
                              {RELATION_TYPES.find((t) => t.value === rel.type)?.label}
                            </span>
                            <span className="font-mono text-xs text-gray-300">{entity.name}</span>
                            <span className="text-gray-600 text-xs">→</span>
                            <span className="font-mono text-xs text-brand-400">{rel.target}</span>
                            <span className="text-gray-600 text-[10px] ml-1">({rel.fieldName})</span>
                            <button onClick={() => removeRelation(ei, ri)}
                              className="ml-auto text-gray-600 hover:text-red-400 text-xs transition-colors">✕</button>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* 관계 추가 폼 */}
                    {addingRelation === ei ? (
                      <div className="border border-brand-500/30 rounded-xl p-3 space-y-3 bg-brand-500/5">
                        <p className="text-xs font-medium text-gray-300">새 관계</p>

                        {/* 관계 타입 */}
                        <div className="space-y-1">
                          {RELATION_TYPES.map((rt) => (
                            <label key={rt.value}
                              className={`flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer border transition-all
                                ${newRelation.type === rt.value
                                  ? 'border-brand-500 bg-brand-500/10'
                                  : 'border-gray-700 hover:border-gray-600'}`}
                            >
                              <input type="radio" name={`rel-type-${ei}`} value={rt.value}
                                checked={newRelation.type === rt.value}
                                onChange={() => {
                                  const fn = defaultFieldName(rt.value as RelationType, newRelation.target);
                                  setNewRelation((r) => ({ ...r, type: rt.value as RelationType, fieldName: fn }));
                                }}
                                className="accent-brand-500" />
                              <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${RELATION_BADGE[rt.value as RelationType]}`}>
                                {rt.label}
                              </span>
                              <span className="text-xs text-gray-400">{rt.desc}</span>
                            </label>
                          ))}
                        </div>

                        <div className="grid grid-cols-2 gap-2">
                          {/* 대상 엔티티 */}
                          <div>
                            <p className="text-[10px] text-gray-500 mb-1">대상 엔티티</p>
                            {others.length === 0 ? (
                              <p className="text-[10px] text-red-400">다른 엔티티가 없습니다.</p>
                            ) : (
                              <select
                                value={newRelation.target}
                                onChange={(e) => {
                                  const fn = defaultFieldName(newRelation.type, e.target.value);
                                  setNewRelation((r) => ({ ...r, target: e.target.value, fieldName: fn }));
                                }}
                                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-2 py-1.5 text-xs
                                  text-gray-100 focus:outline-none focus:ring-1 focus:ring-brand-500"
                              >
                                {others.map((o) => <option key={o.name} value={o.name}>{o.name}</option>)}
                              </select>
                            )}
                          </div>

                          {/* 필드명 */}
                          <div>
                            <p className="text-[10px] text-gray-500 mb-1">프로퍼티명</p>
                            <input
                              value={newRelation.fieldName}
                              onChange={(e) => setNewRelation((r) => ({ ...r, fieldName: e.target.value }))}
                              placeholder="fieldName"
                              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-2 py-1.5 text-xs
                                font-mono text-gray-100 focus:outline-none focus:ring-1 focus:ring-brand-500"
                            />
                          </div>
                        </div>

                        <div className="flex gap-2 justify-end">
                          <button onClick={() => setAddingRelation(null)}
                            className="px-3 py-1.5 text-xs text-gray-400 hover:text-gray-200 transition-colors">
                            취소
                          </button>
                          <button
                            onClick={() => confirmRelation(ei)}
                            disabled={!newRelation.target || !newRelation.fieldName || others.length === 0}
                            className="px-3 py-1.5 bg-brand-500 hover:bg-brand-600 text-white text-xs rounded-lg
                              disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
                            관계 추가
                          </button>
                        </div>
                      </div>
                    ) : (
                      <button
                        onClick={() => openAddRelation(ei)}
                        disabled={others.length === 0}
                        title={others.length === 0 ? '관계를 설정하려면 다른 엔티티가 필요합니다' : ''}
                        className="w-full py-1.5 border border-dashed border-gray-700 rounded-lg text-xs text-gray-500
                          hover:border-blue-500 hover:text-blue-400 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                      >
                        + 관계 추가
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
