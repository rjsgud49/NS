import { ProjectConfig, AuthType } from '@ns/shared';
import { OptionCard } from '@/components/ui/OptionCard';

interface Props { config: ProjectConfig; update: (p: Partial<ProjectConfig>) => void; }

const AUTH_OPTIONS: { value: AuthType; label: string; description: string }[] = [
  { value: 'none', label: '인증 없음', description: '공개 API · 인증 불필요' },
  { value: 'jwt', label: 'JWT', description: 'Access Token만 사용' },
  { value: 'jwt-refresh', label: 'JWT + Refresh Token', description: 'Access + Refresh Token · 자동 토큰 갱신' },
  { value: 'jwt-refresh-roles', label: 'JWT + Refresh + Roles', description: '토큰 갱신 + 역할 기반 권한(RBAC)' },
];

export function Step3Auth({ config, update }: Props) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold">인증 설정</h2>
        <p className="text-gray-400 text-sm mt-1">API 인증 방식을 선택하세요. 선택한 옵션에 맞는 Guard, Strategy, DTO가 자동 생성됩니다.</p>
      </div>

      <div className="space-y-3">
        {AUTH_OPTIONS.map((o) => (
          <OptionCard
            key={o.value}
            value={o.value}
            label={o.label}
            description={o.description}
            selected={config.auth === o.value}
            onClick={() => update({ auth: o.value })}
          />
        ))}
      </div>

      {config.auth !== 'none' && (
        <div className="bg-gray-800/50 rounded-xl p-4 border border-gray-700">
          <p className="text-xs font-medium text-gray-400 mb-2">자동 생성되는 파일</p>
          <ul className="text-xs text-gray-500 space-y-1 font-mono">
            <li>src/auth/auth.module.ts</li>
            <li>src/auth/auth.controller.ts</li>
            <li>src/auth/auth.service.ts</li>
            <li>src/auth/strategies/jwt.strategy.ts</li>
            <li>src/auth/guards/jwt-auth.guard.ts</li>
            {(config.auth === 'jwt-refresh' || config.auth === 'jwt-refresh-roles') && (
              <>
                <li>src/auth/strategies/jwt-refresh.strategy.ts</li>
                <li>src/auth/guards/jwt-refresh.guard.ts</li>
              </>
            )}
            {config.auth === 'jwt-refresh-roles' && (
              <>
                <li>src/auth/guards/roles.guard.ts</li>
                <li>src/auth/decorators/roles.decorator.ts</li>
                <li>src/auth/enums/role.enum.ts</li>
              </>
            )}
          </ul>
        </div>
      )}
    </div>
  );
}
