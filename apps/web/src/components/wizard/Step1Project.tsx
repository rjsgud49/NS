import { ProjectConfig, ArchitectureType } from '@ns/shared';
import { FormField, Input } from '@/components/ui/FormField';

interface Props { config: ProjectConfig; update: (p: Partial<ProjectConfig>) => void; }

const ARCH_OPTIONS: {
  value: ArchitectureType;
  label: string;
  badge: string;
  description: string;
  structure: string[];
}[] = [
  {
    value: 'layered',
    label: 'Layered Architecture',
    badge: '추천 · 기본',
    description: 'NestJS 공식 권장 구조. Controller → Service → Repository 3계층으로 명확하게 역할을 분리한다. 러닝커브가 낮고 대부분의 프로젝트에 적합하다.',
    structure: ['Controller (요청/응답)', 'Service (비즈니스 로직)', 'Repository (데이터 접근)'],
  },
  {
    value: 'clean',
    label: 'Clean Architecture',
    badge: '중급',
    description: 'Robert C. Martin의 클린 아키텍처. 비즈니스 규칙이 인프라에 의존하지 않도록 의존성 방향을 안쪽으로 고정한다. 테스트 용이성과 유지보수성이 높다.',
    structure: ['Presentation (Controller, DTO)', 'Application (Use Cases)', 'Domain (Entity, Interface)', 'Infrastructure (DB, External)'],
  },
  {
    value: 'hexagonal',
    label: 'Hexagonal (Ports & Adapters)',
    badge: '중급',
    description: 'Alistair Cockburn의 헥사고날 아키텍처. 도메인을 중심에 두고 외부 시스템(DB, HTTP, Queue)을 어댑터로 분리한다. 인프라 교체가 자유롭다.',
    structure: ['Domain Core (순수 비즈니스 로직)', 'Inbound Ports (use-case interface)', 'Outbound Ports (repository interface)', 'Adapters (Controller, DB, External)'],
  },
  {
    value: 'cqrs',
    label: 'CQRS',
    badge: '고급',
    description: 'Command Query Responsibility Segregation. 데이터 변경(Command)과 조회(Query)를 완전히 분리한다. @nestjs/cqrs 기반으로 CommandHandler / QueryHandler 패턴이 생성된다.',
    structure: ['Commands + CommandHandlers (쓰기)', 'Queries + QueryHandlers (읽기)', 'Events + EventHandlers (부수효과)', 'Sagas (복잡한 흐름 조율)'],
  },
  {
    value: 'ddd',
    label: 'DDD (Domain-Driven Design)',
    badge: '고급',
    description: '도메인 주도 설계. Aggregate, Value Object, Domain Event, Repository Interface 등 DDD 전술 패턴을 적용한 구조를 생성한다. 복잡한 비즈니스 도메인에 적합하다.',
    structure: ['Domain (Aggregate, Entity, VO, Event)', 'Application (Application Service)', 'Infrastructure (Repository 구현체)', 'Interface (Controller, GraphQL)'],
  },
  {
    value: 'microservices',
    label: 'Microservices-Ready',
    badge: '고급',
    description: 'NestJS 마이크로서비스 전환을 고려한 구조. 도메인 모듈 간 의존을 최소화하고 메시지 기반 통신(TCP/NATS/RabbitMQ) 준비가 된 보일러플레이트를 생성한다.',
    structure: ['독립 모듈 경계 (Bounded Context)', 'Message Patterns (TCP/NATS)', 'API Gateway 패턴', 'Health Check + 서비스 검색'],
  },
];

const BADGE_COLOR: Record<string, string> = {
  '추천 · 기본': 'bg-emerald-500/15 text-emerald-400',
  '중급': 'bg-blue-500/15 text-blue-400',
  '고급': 'bg-purple-500/15 text-purple-400',
};

export function Step1Project({ config, update }: Props) {
  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-xl font-semibold">프로젝트 기본 정보</h2>
        <p className="text-gray-400 text-sm mt-1">생성할 NestJS 프로젝트의 기본 정보를 입력하세요.</p>
      </div>

      {/* Basic info */}
      <div className="grid grid-cols-2 gap-4">
        <FormField label="프로젝트 이름" hint="소문자·하이픈 (npm 패키지명 형식)">
          <Input
            value={config.name}
            onChange={(e) => update({ name: e.target.value })}
            placeholder="my-nest-app"
          />
        </FormField>
        <FormField label="포트 번호">
          <Input
            type="number"
            value={config.port}
            onChange={(e) => update({ port: Number(e.target.value) })}
            placeholder="3000"
          />
        </FormField>
        <FormField label="프로젝트 설명" hint="package.json description">
          <Input
            value={config.description}
            onChange={(e) => update({ description: e.target.value })}
            placeholder="My awesome NestJS API"
            className="col-span-2"
          />
        </FormField>
      </div>

      {/* Architecture */}
      <div className="space-y-3">
        <div>
          <p className="text-sm font-medium text-gray-300">아키텍처 패턴</p>
          <p className="text-xs text-gray-500 mt-0.5">프로젝트의 폴더 구조와 코드 생성 패턴이 달라집니다.</p>
        </div>
        <div className="space-y-2">
          {ARCH_OPTIONS.map((o) => {
            const selected = config.architecture === o.value;
            return (
              <button
                key={o.value}
                onClick={() => update({ architecture: o.value })}
                className={`w-full text-left p-4 rounded-xl border transition-all
                  ${selected
                    ? 'border-brand-500 bg-brand-500/10 ring-1 ring-brand-500'
                    : 'border-gray-700 bg-gray-800/40 hover:border-gray-600'
                  }`}
              >
                <div className="flex items-start justify-between gap-4">
                  {/* Radio + Title */}
                  <div className="flex items-start gap-3 flex-1">
                    <div className={`mt-0.5 w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0
                      ${selected ? 'border-brand-500' : 'border-gray-600'}`}
                    >
                      {selected && <div className="w-2 h-2 rounded-full bg-brand-500" />}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-semibold text-gray-100">{o.label}</span>
                        <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${BADGE_COLOR[o.badge]}`}>
                          {o.badge}
                        </span>
                      </div>
                      <p className="text-xs text-gray-500 mt-1 leading-relaxed">{o.description}</p>
                    </div>
                  </div>

                  {/* Structure preview */}
                  {selected && (
                    <div className="shrink-0 text-right hidden sm:block">
                      <p className="text-[10px] text-gray-600 mb-1">레이어 구조</p>
                      {o.structure.map((s, i) => (
                        <div key={i} className="text-[10px] font-mono text-gray-500 leading-5">
                          {i > 0 && <span className="text-gray-700 mr-1">↓</span>}
                          {s}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Structure expanded on mobile */}
                {selected && (
                  <div className="sm:hidden mt-3 pt-3 border-t border-gray-700">
                    <p className="text-[10px] text-gray-600 mb-1">레이어 구조</p>
                    <div className="flex flex-wrap gap-1">
                      {o.structure.map((s, i) => (
                        <span key={i} className="text-[10px] font-mono bg-gray-800 text-gray-500 px-2 py-0.5 rounded">{s}</span>
                      ))}
                    </div>
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
