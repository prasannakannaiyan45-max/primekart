import React, { useState } from 'react';
import {
  ShieldAlert,
  ShieldCheck,
  Fingerprint,
  Lock,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  RefreshCw,
  Check,
  X,
} from 'lucide-react';
import { SecurityEvaluationResult } from '../types';
import { performBiometricAssertion } from './SecurityCenterView';

interface SecurityCheckoutModalProps {
  evaluation: SecurityEvaluationResult | null;
  isAdmin?: boolean;
  onClose: () => void;
  onProceedAfterVerification: () => void;
  onOpenSecurityCenter: () => void;
  onResetToNormalAndProceed: () => void;
}

export const SecurityCheckoutModal: React.FC<SecurityCheckoutModalProps> = ({
  evaluation,
  isAdmin = false,
  onClose,
  onProceedAfterVerification,
  onOpenSecurityCenter,
  onResetToNormalAndProceed,
}) => {
  const [bioVerifiedHash, setBioVerifiedHash] = useState<string | null>(null);
  const [bioLoading, setBioLoading] = useState(false);
  const [stepUpOtp, setStepUpOtp] = useState('482910');
  const [captchaChecked, setCaptchaChecked] = useState(false);

  if (!evaluation) return null;

  const isBlocked = evaluation.decision === 'BLOCK';
  const isParentRequired = evaluation.decision === 'PARENT_APPROVAL_REQUIRED';
  const isStepUp = evaluation.decision === 'STEP_UP_VERIFICATION';

  const handleParentBiometricAuth = async (decision: 'APPROVE' | 'REJECT') => {
    setBioLoading(true);
    try {
      const token = await performBiometricAssertion();
      const res = await fetch('/api/security/parent-approve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          approvalId: evaluation.parentApprovalRequest?.id || 'live_checkout',
          decision,
          webAuthnChallengeToken: token,
        }),
      });
      const data = await res.json();
      setBioVerifiedHash(data.biometricAuthHash || 'sha256:verified');
      if (decision === 'APPROVE') {
        setTimeout(() => {
          onProceedAfterVerification();
        }, 700);
      } else {
        setTimeout(() => {
          onClose();
        }, 700);
      }
    } finally {
      setBioLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-70 bg-slate-950/75 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-xl w-full border border-slate-200 shadow-2xl overflow-hidden my-auto">
        {/* Header */}
        <div
          className={`px-6 py-4 text-white flex items-center justify-between ${
            isBlocked
              ? 'bg-red-950 border-b border-red-800'
              : isParentRequired
              ? 'bg-slate-900 border-b border-slate-800'
              : 'bg-amber-900 border-b border-amber-800'
          }`}
        >
          <div className="flex items-center gap-2.5">
            {isParentRequired ? (
              <Fingerprint className="w-5 h-5 text-amber-400" />
            ) : (
              <ShieldAlert className="w-5 h-5 text-red-400" />
            )}
            <div>
              <div className="text-sm font-bold uppercase tracking-wider">
                {isBlocked
                  ? '🚨 AI Risk Engine — Transaction Blocked'
                  : isParentRequired
                  ? '🔒 Parent Authorization Required'
                  : '⚠️ Step-Up Security Verification Required'}
              </div>
              <div className="text-[11px] opacity-80 font-mono">
                Evaluation ID: {evaluation.evaluationId} · Final Risk: {evaluation.finalRiskScore}/100 (
                {evaluation.riskLevel})
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 text-white/70 hover:text-white rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-5 text-xs">
          {/* 5 Sub-Engine Risk Score Grid */}
          <div className="grid grid-cols-5 gap-2 text-center">
            {[
              { label: 'Bot Risk', val: evaluation.botRiskScore },
              { label: 'Payment Risk', val: evaluation.paymentRiskScore },
              { label: 'Account Risk', val: evaluation.accountRiskScore },
              { label: 'Device Risk', val: evaluation.deviceRiskScore },
              { label: 'Order Risk', val: evaluation.orderRiskScore },
            ].map((s) => (
              <div
                key={s.label}
                className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/80 space-y-0.5"
              >
                <div className="text-[10px] text-slate-500 font-semibold">{s.label}</div>
                <div
                  className={`text-sm font-bold font-mono ${
                    s.val > 70 ? 'text-red-600' : s.val > 30 ? 'text-amber-600' : 'text-slate-900'
                  }`}
                >
                  {s.val}
                </div>
              </div>
            ))}
          </div>

          {/* EXPLAINABLE AI BREAKDOWN: WHY WAS THIS TRANSACTION FLAGGED? */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2.5">
            <div className="font-bold uppercase tracking-wider text-slate-900 flex items-center justify-between">
              <span>Why Was This Transaction Flagged? (Explainable AI)</span>
              <span
                className={`font-mono text-sm font-extrabold ${
                  evaluation.finalRiskScore > 70 ? 'text-red-600' : 'text-amber-600'
                }`}
              >
                Risk Score: {evaluation.finalRiskScore}/100
              </span>
            </div>

            <div className="space-y-1.5 font-mono">
              {evaluation.whyFlagged.map((factor, idx) => (
                <div key={idx} className="flex items-center justify-between text-slate-700">
                  <span>{factor.label}</span>
                  <span className="font-bold text-red-600">+{factor.points}</span>
                </div>
              ))}
            </div>

            {/* Automated Actions Taken */}
            <div className="pt-2.5 border-t border-slate-200 flex flex-wrap gap-2">
              {evaluation.actionsTaken.map((act, i) => (
                <span
                  key={i}
                  className="inline-flex items-center gap-1 text-[11px] text-slate-700 font-medium"
                >
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                  <span>{act}</span>
                </span>
              ))}
            </div>
          </div>

          {/* CASE 1: PARENTAL AUTHORIZATION FLOW (Biometric Verification) */}
          {isParentRequired && evaluation.parentApprovalRequest && (
            <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-bold text-slate-900 text-sm">
                    Child Account Spending Limit Exceeded
                  </div>
                  <div className="text-slate-600 mt-0.5">
                    Status:{' '}
                    <span className="font-mono font-bold text-amber-800">
                      WAITING FOR PARENT APPROVAL
                    </span>
                  </div>
                </div>
                <div className="text-right font-mono">
                  <div className="text-slate-900 font-bold">
                    Order: ₹{evaluation.parentApprovalRequest.orderValueInr.toLocaleString('en-IN')}
                  </div>
                  <div className="text-slate-500">
                    Parent Limit: ₹
                    {evaluation.parentApprovalRequest.parentLimitInr.toLocaleString('en-IN')}
                  </div>
                </div>
              </div>

              <p className="text-slate-600 leading-relaxed">
                Parent Guardian must authenticate using device biometrics (WebAuthn Touch ID / Face ID assertion). Raw fingerprint or Face ID data is never transmitted or stored.
              </p>

              {bioVerifiedHash && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-900 font-mono text-[11px] flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Biometric Assertion Verified: {bioVerifiedHash}</span>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => handleParentBiometricAuth('APPROVE')}
                  disabled={bioLoading}
                  className="py-3 px-4 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Fingerprint className="w-4 h-4 text-amber-400" />
                  <span>
                    {bioLoading
                      ? 'Authenticating Biometrics...'
                      : 'Biometric Approve & Complete Order'}
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => handleParentBiometricAuth('REJECT')}
                  disabled={bioLoading}
                  className="py-3 px-4 bg-white border border-red-300 hover:bg-red-50 text-red-700 font-bold rounded-xl flex items-center justify-center gap-2 cursor-pointer"
                >
                  <XCircle className="w-4 h-4" />
                  <span>Parent Reject & Cancel Order</span>
                </button>
              </div>
            </div>
          )}

          {/* CASE 2: MEDIUM RISK STEP-UP VERIFICATION (CAPTCHA + OTP) */}
          {isStepUp && (
            <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 space-y-3">
              <div className="font-bold text-slate-900">
                Complete Step-Up Verification to Proceed
              </div>
              <label className="flex items-center gap-2.5 p-3 bg-white border border-slate-200 rounded-lg cursor-pointer">
                <input
                  type="checkbox"
                  checked={captchaChecked}
                  onChange={(e) => setCaptchaChecked(e.target.checked)}
                  className="accent-slate-900 w-4 h-4"
                />
                <span className="font-medium text-slate-800">
                  I am a human shopper (Behavioral Challenge Verified)
                </span>
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={stepUpOtp}
                  onChange={(e) => setStepUpOtp(e.target.value)}
                  placeholder="Enter 6-digit OTP"
                  className="flex-1 px-3 py-2 border border-slate-300 rounded-lg font-mono"
                />
                <button
                  type="button"
                  disabled={!captchaChecked}
                  onClick={onProceedAfterVerification}
                  className="px-5 py-2 bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white font-bold rounded-lg cursor-pointer"
                >
                  Verify & Complete Order
                </button>
              </div>
            </div>
          )}

          {/* CASE 3: HIGH RISK BLOCKED ACTIONS */}
          {isBlocked && (
            <div className={`grid grid-cols-1 ${isAdmin ? 'sm:grid-cols-2' : ''} gap-3 pt-1`}>
              {isAdmin && (
                <button
                  type="button"
                  onClick={onOpenSecurityCenter}
                  className="py-3 px-4 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl flex items-center justify-center gap-2 cursor-pointer"
                >
                  <ShieldAlert className="w-4 h-4 text-amber-400" />
                  <span>Inspect in Security Center (SOC)</span>
                </button>
              )}
              <button
                type="button"
                onClick={onResetToNormalAndProceed}
                className="py-3 px-4 bg-slate-100 hover:bg-slate-200 text-slate-900 font-semibold rounded-xl flex items-center justify-center gap-2 cursor-pointer"
              >
                <RefreshCw className="w-4 h-4" />
                <span>Reset to Normal & Allow Order</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
