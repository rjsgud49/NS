import { ProjectConfig, DatabaseType, OrmType } from '@ns/shared';
import { OptionCard } from '@/components/ui/OptionCard';

interface Props { config: ProjectConfig; update: (p: Partial<ProjectConfig>) => void; }

const DB_OPTIONS: { value: DatabaseType; label: string; description: string }[] = [
  { value: 'postgres', label: 'PostgreSQL', description: '운영 환경 추천 · 강력한 관계형 DB' },
  { value: 'mysql', label: 'MySQL', description: '광범위한 호환성 · 전통적인 RDBMS' },
  { value: 'sqlite', label: 'SQLite', description: '로컬 개발 · 파일 기반 DB' },
  { value: 'mongodb', label: 'MongoDB', description: '도큐먼트 기반 NoSQL' },
];

const ORM_OPTIONS: { value: OrmType; label: string; description: string }[] = [
  { value: 'typeorm', label: 'TypeORM', description: 'NestJS 공식 권장 · 데코레이터 기반' },
  { value: 'prisma', label: 'Prisma', description: '타입 안전 · 직관적인 schema 문법' },
];

export function Step2Database({ config, update }: Props) {
  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-xl font-semibold">데이터베이스 설정</h2>
        <p className="text-gray-400 text-sm mt-1">사용할 데이터베이스와 ORM을 선택하세요.</p>
      </div>

      <div className="space-y-3">
        <p className="text-sm font-medium text-gray-300">데이터베이스</p>
        <div className="grid grid-cols-2 gap-3">
          {DB_OPTIONS.map((o) => (
            <OptionCard
              key={o.value}
              value={o.value}
              label={o.label}
              description={o.description}
              selected={config.database === o.value}
              onClick={() => update({ database: o.value })}
            />
          ))}
        </div>
      </div>

      <div className="space-y-3">
        <p className="text-sm font-medium text-gray-300">ORM</p>
        <div className="grid grid-cols-2 gap-3">
          {ORM_OPTIONS.map((o) => (
            <OptionCard
              key={o.value}
              value={o.value}
              label={o.label}
              description={o.description}
              selected={config.orm === o.value}
              onClick={() => update({ orm: o.value })}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
