'use client';

import { useState } from 'react';
import { ProjectConfig } from '@ns/shared';
import { defaultConfig } from '@/lib/defaults';
import { StepIndicator } from '@/components/wizard/StepIndicator';
import { Step1Project } from '@/components/wizard/Step1Project';
import { Step2Database } from '@/components/wizard/Step2Database';
import { Step3Auth } from '@/components/wizard/Step3Auth';
import { Step4Features } from '@/components/wizard/Step4Features';
import { Step5Entities } from '@/components/wizard/Step5Entities';
import { Step6Generate } from '@/components/wizard/Step6Generate';

const STEPS = [
  { id: 1, label: '프로젝트' },
  { id: 2, label: '데이터베이스' },
  { id: 3, label: '인증' },
  { id: 4, label: '기능' },
  { id: 5, label: '엔티티' },
  { id: 6, label: '생성' },
];

export default function Home() {
  const [step, setStep] = useState(1);
  const [config, setConfig] = useState<ProjectConfig>(defaultConfig);

  const update = (partial: Partial<ProjectConfig>) =>
    setConfig((prev) => ({ ...prev, ...partial }));

  const next = () => setStep((s) => Math.min(s + 1, STEPS.length));
  const prev = () => setStep((s) => Math.max(s - 1, 1));

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="border-b border-gray-800 px-6 py-4 flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-brand-500 flex items-center justify-center font-bold text-white text-sm">N</div>
        <span className="font-semibold text-lg tracking-tight">NS</span>
        <span className="text-gray-500 text-sm ml-1">NestJS Server Generator</span>
      </header>

      <div className="flex-1 max-w-4xl mx-auto w-full px-4 py-10">
        <StepIndicator steps={STEPS} current={step} onGoto={setStep} />

        <div className="mt-8 bg-gray-900 rounded-2xl border border-gray-800 p-8">
          {step === 1 && <Step1Project config={config} update={update} />}
          {step === 2 && <Step2Database config={config} update={update} />}
          {step === 3 && <Step3Auth config={config} update={update} />}
          {step === 4 && <Step4Features config={config} update={update} />}
          {step === 5 && <Step5Entities config={config} update={update} />}
          {step === 6 && <Step6Generate config={config} />}
        </div>

        {/* Navigation */}
        <div className="mt-6 flex justify-between">
          <button
            onClick={prev}
            disabled={step === 1}
            className="px-5 py-2.5 rounded-lg border border-gray-700 text-gray-300 hover:bg-gray-800 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          >
            이전
          </button>
          {step < STEPS.length && (
            <button
              onClick={next}
              className="px-6 py-2.5 rounded-lg bg-brand-500 hover:bg-brand-600 text-white font-medium transition-colors"
            >
              다음
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
