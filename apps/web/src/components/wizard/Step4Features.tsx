import { ProjectConfig } from '@ns/shared';
import { Toggle } from '@/components/ui/OptionCard';

interface Props { config: ProjectConfig; update: (p: Partial<ProjectConfig>) => void; }

const FEATURE_LIST = [
  {
    key: 'swagger' as const,
    label: 'Swagger / OpenAPI',
    description: 'API 문서 자동 생성 · /api 경로에서 확인',
  },
  {
    key: 'validation' as const,
    label: 'class-validator',
    description: 'DTO 자동 유효성 검사 · ValidationPipe 설정 포함',
  },
  {
    key: 'cors' as const,
    label: 'CORS 설정',
    description: 'Cross-Origin 요청 허용 · 프론트엔드 연동 필수',
  },
  {
    key: 'rateLimit' as const,
    label: 'Rate Limiting',
    description: 'ThrottlerModule · 분당 100회 기본 설정',
  },
];

export function Step4Features({ config, update }: Props) {
  const toggle = (key: keyof ProjectConfig['features']) => {
    update({ features: { ...config.features, [key]: !config.features[key] } });
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold">추가 기능 설정</h2>
        <p className="text-gray-400 text-sm mt-1">포함할 기능을 선택하세요. 토글로 켜고 끌 수 있습니다.</p>
      </div>

      <div className="space-y-3">
        {FEATURE_LIST.map((f) => (
          <Toggle
            key={f.key}
            label={f.label}
            description={f.description}
            checked={config.features[f.key]}
            onChange={() => toggle(f.key)}
          />
        ))}
      </div>
    </div>
  );
}
