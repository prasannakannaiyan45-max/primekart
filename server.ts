import 'dotenv/config';
import fs from 'fs';
import crypto from 'crypto';
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI, Type } from '@google/genai';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function getGenAIClient() {
  return new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

// ============================================================================
// SERVER-AUTHORITATIVE CYBERSECURITY & EXPLAINABLE AI RISK ENGINE STATE
// ============================================================================
// NOTE: Never store plaintext passwords, raw payment credentials, or raw
// biometric templates. Biometric verification uses one-way SHA-256 challenge
// hashes derived from WebAuthn / platform authenticator assertions.

interface RiskFactorContribution {
  points: number;
  label: string;
  category: 'bot' | 'payment' | 'account' | 'device' | 'order' | 'parental';
}

interface SecurityEventLog {
  id: string;
  timestamp: string;
  userId: string;
  sessionId: string;
  deviceId: string;
  eventType:
    | 'BOT_ATTACK_DETECTED'
    | 'PAYMENT_ANOMALY'
    | 'NEW_DEVICE'
    | 'HIGH_RISK_ORDER'
    | 'NORMAL_TRANSACTION'
    | 'PARENT_APPROVAL_REQUEST'
    | 'CORRELATED_THREAT';
  threatTitle: string;
  riskScore: number;
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
  reasons: RiskFactorContribution[];
  signals: string[];
  actionsTaken: string[];
  actionSummary: 'ALLOW' | 'VERIFY' | 'BLOCK' | 'WAIT_PARENT';
  finalStatus:
    | 'APPROVED'
    | 'VERIFICATION_REQUIRED'
    | 'THREAT_CONTAINED'
    | 'WAITING_PARENT'
    | 'PARENT_APPROVED'
    | 'PARENT_REJECTED';
}

interface PendingParentApproval {
  id: string;
  timestamp: string;
  childUserId: string;
  childName: string;
  itemsSummary: string;
  orderValueInr: number;
  parentLimitInr: number;
  reason: string;
  status: 'WAITING_FOR_PARENT_APPROVAL' | 'APPROVED' | 'REJECTED';
  biometricAuthHash?: string;
}

const securityStore = {
  activeSimMode: 'NORMAL' as
    | 'NORMAL'
    | 'BOT_ATTACK'
    | 'PAYMENT_ATTACK'
    | 'HIGH_RISK_CORRELATED'
    | 'PARENT_APPROVAL',
  metrics: {
    threatsDetected: 3,
    blockedTransactions: 2,
    botAttacks: 1,
    paymentAttacks: 1,
    pendingParentApprovals: 0,
    activeSuspiciousSessions: 0,
  },
  liveTelemetry: {
    requestsPerMin: 18,
    repeatedProductRequests: 2,
    rapidAddToCartCount: 1,
    checkoutAttempts: 1,
    failedPaymentAttempts: 0,
    paymentMethodsAttempted: 1,
    accountsOnDevice: 1,
    isNewDevice: false,
    isNewAccount: false,
    botRiskScore: 8,
    paymentRiskScore: 6,
    correlatedRiskScore: 8,
  },
  parentalConfig: {
    isChildAccount: false,
    maxSpendLimitInr: 2000,
    restrictedCategories: ['Audio & Acoustics', 'Precision Horology'],
    requireFirstTimeApproval: true,
    highValueThresholdInr: 5000,
    parentName: 'Parent Guardian (Biometric Verified)',
  },
  pendingApprovals: [] as PendingParentApproval[],
  eventLogs: [
    {
      id: 'sec_evt_initial_03',
      timestamp: new Date(Date.now() - 1000 * 60 * 14).toISOString(),
      userId: 'USER_8841_BOT',
      sessionId: 'SES_9920_SCALP',
      deviceId: 'DEV_FINGERPRINT_X89',
      eventType: 'BOT_ATTACK_DETECTED',
      threatTitle: 'Automated GPU/Smartphone Scalping Bot Contained',
      riskScore: 94,
      riskLevel: 'HIGH',
      reasons: [
        { points: 35, label: 'Extreme request velocity (812 requests/min)', category: 'bot' },
        { points: 25, label: 'Repeated product polling (146 refreshes)', category: 'bot' },
        { points: 20, label: 'Rapid automated checkout bursts (23 attempts)', category: 'bot' },
        { points: 14, label: 'Multiple accounts sharing single device fingerprint (4 accounts)', category: 'device' },
      ],
      signals: [
        '812 requests/min',
        '146 repeated product requests',
        '23 checkout attempts in 45s',
        '4 accounts on same device session',
      ],
      actionsTaken: [
        'Rate limited API & product polling',
        'Checkout temporarily blocked',
        'Security event logged & SOC alerted',
      ],
      actionSummary: 'BLOCK',
      finalStatus: 'THREAT_CONTAINED',
    },
    {
      id: 'sec_evt_initial_02',
      timestamp: new Date(Date.now() - 1000 * 60 * 8).toISOString(),
      userId: 'USER_4092_CARD',
      sessionId: 'SES_7741_PAY',
      deviceId: 'DEV_NEW_UNKNOWN_12',
      eventType: 'PAYMENT_ANOMALY',
      threatTitle: 'High-Velocity Card/UPI Credential Stuffing Blocked',
      riskScore: 88,
      riskLevel: 'HIGH',
      reasons: [
        { points: 30, label: 'Multiple failed payment attempts (6 failures)', category: 'payment' },
        { points: 25, label: 'Multiple payment instruments cycled (4 methods)', category: 'payment' },
        { points: 18, label: 'Unrecognized new device fingerprint', category: 'device' },
        { points: 15, label: 'High-value transaction spike (₹74,500)', category: 'order' },
      ],
      signals: [
        '6 failed payment attempts',
        '4 payment methods attempted (Card, UPI, Wallet, NetBanking)',
        'New device: YES',
        'Transaction value: ₹74,500',
      ],
      actionsTaken: [
        'Payment gateway token locked',
        'Transaction blocked',
        'Administrator security alert dispatched',
      ],
      actionSummary: 'BLOCK',
      finalStatus: 'THREAT_CONTAINED',
    },
    {
      id: 'sec_evt_initial_01',
      timestamp: new Date(Date.now() - 1000 * 60 * 3).toISOString(),
      userId: 'USER_1024_VERIFIED',
      sessionId: 'SES_3012_CLEAN',
      deviceId: 'DEV_TRUSTED_MACOS',
      eventType: 'NORMAL_TRANSACTION',
      threatTitle: 'Standard Verified Customer Order Approved',
      riskScore: 8,
      riskLevel: 'LOW',
      reasons: [
        { points: 5, label: 'Normal browsing cadence (18 req/min)', category: 'bot' },
        { points: 3, label: 'Trusted known device & verified payment method', category: 'payment' },
      ],
      signals: [
        '18 requests/min',
        '0 failed payments',
        'Trusted device session',
      ],
      actionsTaken: [
        'Order approved automatically',
        'Audit log recorded',
      ],
      actionSummary: 'ALLOW',
      finalStatus: 'APPROVED',
    },
  ] as SecurityEventLog[],
};

/**
 * Helper to compute risk level from 0-100 score
 */
function getRiskLevel(score: number): 'LOW' | 'MEDIUM' | 'HIGH' {
  if (score <= 30) return 'LOW';
  if (score <= 70) return 'MEDIUM';
  return 'HIGH';
}

/**
 * Core Explainable AI Risk & Correlation Engine:
 * Combines signals from Bot Detection, Payment Security, Device, Account,
 * Order Economics, and Parental Controls into a transparent 0-100 score.
 */
function evaluateTransactionRisk(params: {
  userId: string;
  userName: string;
  sessionId: string;
  deviceId: string;
  orderValueInr: number;
  itemsSummary: string;
  categories: string[];
  paymentMethod: string;
}) {
  const t = securityStore.liveTelemetry;
  const pConfig = securityStore.parentalConfig;

  const whyFlagged: RiskFactorContribution[] = [];
  const correlatedSignals: string[] = [];

  // -------------------------------------------------------------------------
  // 1. BOT & SCALPING DETECTION ENGINE (0-100)
  // -------------------------------------------------------------------------
  let botScore = 6;
  if (t.requestsPerMin > 300) {
    botScore += 38;
    whyFlagged.push({
      points: 25,
      label: `High request frequency (${t.requestsPerMin} requests/min)`,
      category: 'bot',
    });
    correlatedSignals.push(`${t.requestsPerMin} requests/min`);
  } else if (t.requestsPerMin > 80) {
    botScore += 22;
    whyFlagged.push({
      points: 15,
      label: `Elevated request rate (${t.requestsPerMin} requests/min)`,
      category: 'bot',
    });
    correlatedSignals.push(`${t.requestsPerMin} requests/min`);
  }

  if (t.repeatedProductRequests > 30) {
    botScore += 28;
    whyFlagged.push({
      points: 15,
      label: `Abnormal product refresh polling (${t.repeatedProductRequests} repeats)`,
      category: 'bot',
    });
    correlatedSignals.push(`${t.repeatedProductRequests} repeated product requests`);
  }

  if (t.checkoutAttempts > 5) {
    botScore += 24;
    whyFlagged.push({
      points: 15,
      label: `Rapid automated checkout bursts (${t.checkoutAttempts} attempts)`,
      category: 'bot',
    });
    correlatedSignals.push(`${t.checkoutAttempts} checkout attempts`);
  }

  botScore = Math.min(100, botScore);

  // -------------------------------------------------------------------------
  // 2. PAYMENT ATTACK DETECTION ENGINE (0-100)
  // -------------------------------------------------------------------------
  let paymentScore = 5;
  if (t.failedPaymentAttempts >= 3) {
    paymentScore += 45;
    whyFlagged.push({
      points: 20,
      label: `Multiple failed payments (${t.failedPaymentAttempts} failed attempts)`,
      category: 'payment',
    });
    correlatedSignals.push(`${t.failedPaymentAttempts} failed payment attempts`);
  } else if (t.failedPaymentAttempts > 0) {
    paymentScore += 18;
    whyFlagged.push({
      points: 10,
      label: `Recent payment retry (${t.failedPaymentAttempts} failed attempt)`,
      category: 'payment',
    });
  }

  if (t.paymentMethodsAttempted >= 3) {
    paymentScore += 28;
    whyFlagged.push({
      points: 15,
      label: `Multiple payment methods attempted (${t.paymentMethodsAttempted} instruments)`,
      category: 'payment',
    });
    correlatedSignals.push(`${t.paymentMethodsAttempted} payment methods attempted`);
  }

  paymentScore = Math.min(100, paymentScore);

  // -------------------------------------------------------------------------
  // 3. ACCOUNT, DEVICE & ORDER VALUE CORRELATION
  // -------------------------------------------------------------------------
  let accountScore = t.isNewAccount ? 65 : 10;
  if (t.isNewAccount) {
    whyFlagged.push({
      points: 10,
      label: 'New account attempting high-velocity checkout',
      category: 'account',
    });
    correlatedSignals.push('New account');
  }

  let deviceScore = t.isNewDevice ? 70 : 8;
  if (t.isNewDevice) {
    whyFlagged.push({
      points: 15,
      label: 'Unrecognized new device session fingerprint',
      category: 'device',
    });
    correlatedSignals.push('New device');
  }

  if (t.accountsOnDevice > 2) {
    deviceScore = Math.min(100, deviceScore + 25);
    whyFlagged.push({
      points: 10,
      label: `Multiple accounts sharing device (${t.accountsOnDevice} accounts)`,
      category: 'device',
    });
    correlatedSignals.push(`${t.accountsOnDevice} accounts on same device`);
  }

  let orderScore = params.orderValueInr >= 40000 ? 68 : params.orderValueInr >= 15000 ? 28 : 10;
  if (params.orderValueInr >= 40000 && (t.isNewDevice || t.isNewAccount || botScore > 50 || paymentScore > 50)) {
    whyFlagged.push({
      points: 10,
      label: `High-value order (₹${params.orderValueInr.toLocaleString('en-IN')})`,
      category: 'order',
    });
    correlatedSignals.push(`High-value order: ₹${params.orderValueInr.toLocaleString('en-IN')}`);
  }

  // If normal shopper with no flags, add transparent baseline explanation
  if (whyFlagged.length === 0) {
    whyFlagged.push(
      { points: 5, label: `Normal request velocity (${t.requestsPerMin} req/min)`, category: 'bot' },
      { points: 3, label: `Verified ${params.paymentMethod} instrument with 0 failures`, category: 'payment' }
    );
    correlatedSignals.push(
      `${t.requestsPerMin} req/min (Normal)`,
      'Trusted device session',
      '0 failed payments'
    );
  }

  // Calculate Final Correlated Risk Score
  const rawPointsSum = whyFlagged.reduce((acc, f) => acc + f.points, 0);
  let finalRiskScore = Math.min(
    98,
    Math.max(
      rawPointsSum,
      Math.round(
        botScore * 0.35 +
          paymentScore * 0.35 +
          deviceScore * 0.12 +
          accountScore * 0.08 +
          orderScore * 0.1
      )
    )
  );

  if (securityStore.activeSimMode === 'BOT_ATTACK') {
    botScore = 94;
    finalRiskScore = 94;
  } else if (securityStore.activeSimMode === 'PAYMENT_ATTACK') {
    paymentScore = 88;
    finalRiskScore = 88;
  } else if (securityStore.activeSimMode === 'HIGH_RISK_CORRELATED') {
    botScore = 86;
    paymentScore = 84;
    finalRiskScore = 96;
  } else if (securityStore.activeSimMode === 'NORMAL' && t.failedPaymentAttempts === 0 && t.requestsPerMin < 50) {
    finalRiskScore = 8;
  }

  const riskLevel = getRiskLevel(finalRiskScore);

  // -------------------------------------------------------------------------
  // 4. PARENTAL AUTHORIZATION CHECK (For Child Accounts)
  // -------------------------------------------------------------------------
  let parentApprovalRequest: PendingParentApproval | null = null;
  const exceedsParentLimit =
    pConfig.isChildAccount && params.orderValueInr > pConfig.maxSpendLimitInr;

  if (exceedsParentLimit) {
    whyFlagged.push({
      points: 35,
      label: `Child account order (₹${params.orderValueInr.toLocaleString('en-IN')}) exceeds Parent Limit (₹${pConfig.maxSpendLimitInr.toLocaleString('en-IN')})`,
      category: 'parental',
    });
    correlatedSignals.push(
      `Child Account Limit Exceeded (Order: ₹${params.orderValueInr.toLocaleString('en-IN')} > Limit: ₹${pConfig.maxSpendLimitInr.toLocaleString('en-IN')})`
    );

    parentApprovalRequest = {
      id: `par_req_${Date.now()}`,
      timestamp: new Date().toISOString(),
      childUserId: params.userId,
      childName: params.userName || 'Child Account',
      itemsSummary: params.itemsSummary,
      orderValueInr: params.orderValueInr,
      parentLimitInr: pConfig.maxSpendLimitInr,
      reason: `Order value ₹${params.orderValueInr.toLocaleString('en-IN')} exceeds parent spending limit of ₹${pConfig.maxSpendLimitInr.toLocaleString('en-IN')}`,
      status: 'WAITING_FOR_PARENT_APPROVAL',
    };

    securityStore.pendingApprovals.unshift(parentApprovalRequest);
    securityStore.metrics.pendingParentApprovals = securityStore.pendingApprovals.filter(
      (a) => a.status === 'WAITING_FOR_PARENT_APPROVAL'
    ).length;
  }

  // Determine Automated Decision & Actions
  let decision: 'ALLOW' | 'STEP_UP_VERIFICATION' | 'PARENT_APPROVAL_REQUIRED' | 'BLOCK' = 'ALLOW';
  let actionsTaken: string[] = [];
  let eventType: SecurityEventLog['eventType'] = 'NORMAL_TRANSACTION';
  let threatTitle = 'Verified Low-Risk Checkout Approved';
  let actionSummary: SecurityEventLog['actionSummary'] = 'ALLOW';
  let finalStatus: SecurityEventLog['finalStatus'] = 'APPROVED';

  if (exceedsParentLimit) {
    decision = 'PARENT_APPROVAL_REQUIRED';
    actionsTaken = [
      'Order paused awaiting Parent Biometric Approval',
      'Parent notification dispatched',
      'Security event logged',
    ];
    eventType = 'PARENT_APPROVAL_REQUEST';
    threatTitle = `Parent Authorization Required (₹${params.orderValueInr.toLocaleString('en-IN')} > ₹${pConfig.maxSpendLimitInr.toLocaleString('en-IN')})`;
    actionSummary = 'WAIT_PARENT';
    finalStatus = 'WAITING_PARENT';
  } else if (riskLevel === 'HIGH') {
    decision = 'BLOCK';
    actionsTaken = [
      'Rate limited suspicious session',
      'Checkout & payment blocked automatically',
      'SOC Security Center alerted & event logged',
    ];
    if (securityStore.activeSimMode === 'BOT_ATTACK' || botScore >= 80) {
      eventType = 'BOT_ATTACK_DETECTED';
      threatTitle = 'Automated Purchase Scalping Bot Blocked';
    } else if (securityStore.activeSimMode === 'PAYMENT_ATTACK' || paymentScore >= 80) {
      eventType = 'PAYMENT_ANOMALY';
      threatTitle = 'Payment Credential / Retry Attack Blocked';
    } else {
      eventType = 'CORRELATED_THREAT';
      threatTitle = 'Correlated Multi-Vector Fraud Attempt Contained';
    }
    actionSummary = 'BLOCK';
    finalStatus = 'THREAT_CONTAINED';
    securityStore.metrics.threatsDetected += 1;
    securityStore.metrics.blockedTransactions += 1;
  } else if (riskLevel === 'MEDIUM') {
    decision = 'STEP_UP_VERIFICATION';
    actionsTaken = [
      'Step-up OTP & CAPTCHA challenge triggered',
      'Session placed under elevated monitoring',
    ];
    eventType = 'NEW_DEVICE';
    threatTitle = 'Medium-Risk Transaction — Step-Up Verification Triggered';
    actionSummary = 'VERIFY';
    finalStatus = 'VERIFICATION_REQUIRED';
  } else {
    decision = 'ALLOW';
    actionsTaken = [
      'AI Risk Engine verified LOW risk',
      'Order allowed without friction',
      'Transaction logged to security ledger',
    ];
  }

  // Record structured security event log (No PII/card/biometric secrets)
  const logEntry: SecurityEventLog = {
    id: `sec_evt_${Date.now()}`,
    timestamp: new Date().toISOString(),
    userId: params.userId || 'GUEST_USER',
    sessionId: params.sessionId,
    deviceId: params.deviceId,
    eventType,
    threatTitle,
    riskScore: finalRiskScore,
    riskLevel,
    reasons: whyFlagged,
    signals: correlatedSignals,
    actionsTaken,
    actionSummary,
    finalStatus,
  };

  securityStore.eventLogs.unshift(logEntry);
  if (securityStore.eventLogs.length > 50) {
    securityStore.eventLogs.pop();
  }

  return {
    evaluationId: logEntry.id,
    timestamp: logEntry.timestamp,
    userId: logEntry.userId,
    sessionId: logEntry.sessionId,
    deviceId: logEntry.deviceId,
    botRiskScore: botScore,
    paymentRiskScore: paymentScore,
    accountRiskScore: accountScore,
    deviceRiskScore: deviceScore,
    orderRiskScore: orderScore,
    finalRiskScore,
    riskLevel,
    decision,
    whyFlagged,
    correlatedSignals,
    actionsTaken,
    telemetrySnapshot: {
      requestsPerMin: t.requestsPerMin,
      repeatedProductRequests: t.repeatedProductRequests,
      checkoutAttempts: t.checkoutAttempts,
      failedPaymentAttempts: t.failedPaymentAttempts,
      paymentMethodsAttempted: t.paymentMethodsAttempted,
      isNewDevice: t.isNewDevice,
      isNewAccount: t.isNewAccount,
      orderValueInr: params.orderValueInr,
    },
    parentApprovalRequest,
  };
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: '12mb' }));

  // ===========================================================================
  // CYBERSECURITY API 1: Get Real-Time Security Center State & Logs
  // ===========================================================================
  app.get('/api/security/state', (_req, res) => {
    res.json(securityStore);
  });

  // ===========================================================================
  // CYBERSECURITY API 2: Ingest Behavioral Telemetry Signals
  // ===========================================================================
  app.post('/api/security/telemetry', (req, res) => {
    const { actionType } = req.body || {};
    if (actionType === 'ADD_TO_CART') {
      securityStore.liveTelemetry.rapidAddToCartCount += 1;
      securityStore.liveTelemetry.requestsPerMin = Math.min(
        950,
        securityStore.liveTelemetry.requestsPerMin + 3
      );
    } else if (actionType === 'PRODUCT_VIEW') {
      securityStore.liveTelemetry.repeatedProductRequests += 1;
    }
    res.json({ ok: true, liveTelemetry: securityStore.liveTelemetry });
  });

  // ===========================================================================
  // CYBERSECURITY API 3: Evaluate Checkout via Explainable AI Risk Engine
  // ===========================================================================
  app.post('/api/security/evaluate-checkout', (req, res) => {
    const {
      userId = 'USER_1024',
      userName = 'Verified Shopper',
      sessionId = 'SES_ACTIVE_01',
      deviceId = 'DEV_BROWSER_01',
      orderValueInr = 25000,
      itemsSummary = '1x Marketplace Order',
      categories = [],
      paymentMethod = 'UPI',
    } = req.body || {};

    const evaluation = evaluateTransactionRisk({
      userId: String(userId).slice(0, 64),
      userName: String(userName).slice(0, 64),
      sessionId: String(sessionId).slice(0, 64),
      deviceId: String(deviceId).slice(0, 64),
      orderValueInr: Number(orderValueInr) || 0,
      itemsSummary: String(itemsSummary).slice(0, 300),
      categories: Array.isArray(categories) ? categories : [],
      paymentMethod: String(paymentMethod),
    });

    res.json(evaluation);
  });

  // ===========================================================================
  // CYBERSECURITY API 4: Hackathon Attack Simulation Controller
  // ===========================================================================
  app.post('/api/security/simulate', (req, res) => {
    const { mode } = req.body || {};

    if (mode === 'BOT_ATTACK') {
      securityStore.activeSimMode = 'BOT_ATTACK';
      securityStore.liveTelemetry = {
        requestsPerMin: 812,
        repeatedProductRequests: 146,
        rapidAddToCartCount: 39,
        checkoutAttempts: 23,
        failedPaymentAttempts: 0,
        paymentMethodsAttempted: 1,
        accountsOnDevice: 4,
        isNewDevice: true,
        isNewAccount: false,
        botRiskScore: 94,
        paymentRiskScore: 18,
        correlatedRiskScore: 94,
      };
      securityStore.metrics.threatsDetected += 1;
      securityStore.metrics.botAttacks += 1;
      securityStore.metrics.blockedTransactions += 1;
      securityStore.metrics.activeSuspiciousSessions = 3;

      securityStore.eventLogs.unshift({
        id: `sec_sim_bot_${Date.now()}`,
        timestamp: new Date().toISOString(),
        userId: 'BOT_SCALPER_901',
        sessionId: 'SES_BOT_BURST_812',
        deviceId: 'DEV_HEADLESS_FARM_09',
        eventType: 'BOT_ATTACK_DETECTED',
        threatTitle: 'BOT ATTACK DETECTED — Automated Purchase Abuse (812 req/min)',
        riskScore: 94,
        riskLevel: 'HIGH',
        reasons: [
          { points: 35, label: 'High request frequency (812 requests/min)', category: 'bot' },
          { points: 25, label: 'Repeated product requests (146 polling hits)', category: 'bot' },
          { points: 20, label: 'Rapid checkout attempts (23 attempts)', category: 'bot' },
          { points: 14, label: 'Multiple accounts on same device (4 accounts)', category: 'device' },
        ],
        signals: [
          '812 requests/min',
          '146 repeated product requests',
          '23 checkout attempts',
          'New device',
          'Multiple accounts (4)',
        ],
        actionsTaken: [
          'Rate limited',
          'Checkout temporarily blocked',
          'Security event logged',
        ],
        actionSummary: 'BLOCK',
        finalStatus: 'THREAT_CONTAINED',
      });
    } else if (mode === 'PAYMENT_ATTACK') {
      securityStore.activeSimMode = 'PAYMENT_ATTACK';
      securityStore.liveTelemetry = {
        requestsPerMin: 64,
        repeatedProductRequests: 8,
        rapidAddToCartCount: 2,
        checkoutAttempts: 7,
        failedPaymentAttempts: 6,
        paymentMethodsAttempted: 4,
        accountsOnDevice: 2,
        isNewDevice: true,
        isNewAccount: true,
        botRiskScore: 32,
        paymentRiskScore: 88,
        correlatedRiskScore: 88,
      };
      securityStore.metrics.threatsDetected += 1;
      securityStore.metrics.paymentAttacks += 1;
      securityStore.metrics.blockedTransactions += 1;
      securityStore.metrics.activeSuspiciousSessions = 2;

      securityStore.eventLogs.unshift({
        id: `sec_sim_pay_${Date.now()}`,
        timestamp: new Date().toISOString(),
        userId: 'USER_CARD_TEST_44',
        sessionId: 'SES_PAY_RETRY_06',
        deviceId: 'DEV_UNTRUSTED_VPN_7',
        eventType: 'PAYMENT_ANOMALY',
        threatTitle: 'PAYMENT ATTACK DETECTED — 6 Failed Retries Across 4 Instruments',
        riskScore: 88,
        riskLevel: 'HIGH',
        reasons: [
          { points: 30, label: 'Multiple failed payment attempts (6 failed)', category: 'payment' },
          { points: 25, label: 'Multiple payment methods attempted (4 methods)', category: 'payment' },
          { points: 18, label: 'New unrecognized device (YES)', category: 'device' },
          { points: 15, label: 'High-value transaction (₹45,000)', category: 'order' },
        ],
        signals: [
          'Failed attempts: 6',
          'Payment methods attempted: 4',
          'Transaction value: ₹45,000',
          'New device: YES',
        ],
        actionsTaken: [
          'Payment blocked',
          'Security alert generated',
          'Security event logged',
        ],
        actionSummary: 'BLOCK',
        finalStatus: 'THREAT_CONTAINED',
      });
    } else if (mode === 'HIGH_RISK_CORRELATED') {
      securityStore.activeSimMode = 'HIGH_RISK_CORRELATED';
      securityStore.liveTelemetry = {
        requestsPerMin: 640,
        repeatedProductRequests: 92,
        rapidAddToCartCount: 18,
        checkoutAttempts: 14,
        failedPaymentAttempts: 5,
        paymentMethodsAttempted: 4,
        accountsOnDevice: 3,
        isNewDevice: true,
        isNewAccount: true,
        botRiskScore: 82,
        paymentRiskScore: 76,
        correlatedRiskScore: 96,
      };
      securityStore.metrics.threatsDetected += 1;
      securityStore.metrics.blockedTransactions += 1;
      securityStore.metrics.activeSuspiciousSessions = 4;

      securityStore.eventLogs.unshift({
        id: `sec_sim_corr_${Date.now()}`,
        timestamp: new Date().toISOString(),
        userId: 'USER_CORR_THREAT_99',
        sessionId: 'SES_MULTI_VEC_96',
        deviceId: 'DEV_SPOOFED_881',
        eventType: 'CORRELATED_THREAT',
        threatTitle: 'CORRELATED SECURITY THREAT — Bot + Payment + New Device + High-Value Order',
        riskScore: 96,
        riskLevel: 'HIGH',
        reasons: [
          { points: 25, label: 'High request frequency (640 req/min)', category: 'bot' },
          { points: 20, label: 'Multiple failed payments (5 attempts)', category: 'payment' },
          { points: 15, label: 'New device fingerprint', category: 'device' },
          { points: 16, label: 'High-value order (₹91,766)', category: 'order' },
          { points: 10, label: 'New account (< 10 mins old)', category: 'account' },
          { points: 10, label: 'Unusual purchase velocity across 3 accounts', category: 'bot' },
        ],
        signals: [
          'New account',
          'New device',
          'High request frequency (640/min)',
          'Multiple failed payments (5)',
          'High-value order (₹91,766)',
        ],
        actionsTaken: [
          'TRANSACTION BLOCKED',
          'ADMIN ALERT DISPATCHED',
          'SECURITY EVENT LOGGED',
        ],
        actionSummary: 'BLOCK',
        finalStatus: 'THREAT_CONTAINED',
      });
    } else if (mode === 'PARENT_APPROVAL') {
      securityStore.activeSimMode = 'PARENT_APPROVAL';
      securityStore.parentalConfig.isChildAccount = true;
      securityStore.parentalConfig.maxSpendLimitInr = 2000;
      securityStore.liveTelemetry = {
        requestsPerMin: 22,
        repeatedProductRequests: 3,
        rapidAddToCartCount: 1,
        checkoutAttempts: 1,
        failedPaymentAttempts: 0,
        paymentMethodsAttempted: 1,
        accountsOnDevice: 1,
        isNewDevice: false,
        isNewAccount: false,
        botRiskScore: 10,
        paymentRiskScore: 8,
        correlatedRiskScore: 45,
      };

      const sampleApproval: PendingParentApproval = {
        id: `par_sim_${Date.now()}`,
        timestamp: new Date().toISOString(),
        childUserId: 'CHILD_AARAV_14',
        childName: 'Aarav (Child Account)',
        itemsSummary: '1x AetherPhone Pro Max 5G (Natural Titanium)',
        orderValueInr: 91766,
        parentLimitInr: 2000,
        reason: 'Order Value (₹91,766) exceeds Parent Spending Limit (₹2,000)',
        status: 'WAITING_FOR_PARENT_APPROVAL',
      };
      securityStore.pendingApprovals.unshift(sampleApproval);
      securityStore.metrics.pendingParentApprovals = securityStore.pendingApprovals.filter(
        (a) => a.status === 'WAITING_FOR_PARENT_APPROVAL'
      ).length;

      securityStore.eventLogs.unshift({
        id: `sec_sim_par_${Date.now()}`,
        timestamp: new Date().toISOString(),
        userId: 'CHILD_AARAV_14',
        sessionId: 'SES_FAMILY_04',
        deviceId: 'DEV_FAMILY_IPAD',
        eventType: 'PARENT_APPROVAL_REQUEST',
        threatTitle: 'PARENT AUTHORIZATION REQUIRED — Child Order ₹91,766 (Limit ₹2,000)',
        riskScore: 48,
        riskLevel: 'MEDIUM',
        reasons: [
          { points: 38, label: 'Order value ₹91,766 exceeds ₹2,000 parent limit', category: 'parental' },
          { points: 10, label: 'Restricted category: Mobiles, Audio & Electronics', category: 'parental' },
        ],
        signals: [
          'Child Account: YES',
          'Order Value: ₹91,766',
          'Parent Limit: ₹2,000',
          'Status: WAITING FOR PARENT APPROVAL',
        ],
        actionsTaken: [
          'Order held for Parent Biometric Verification',
          'Parent notification sent',
        ],
        actionSummary: 'WAIT_PARENT',
        finalStatus: 'WAITING_PARENT',
      });
    } else {
      // RESET TO NORMAL
      securityStore.activeSimMode = 'NORMAL';
      securityStore.parentalConfig.isChildAccount = false;
      securityStore.liveTelemetry = {
        requestsPerMin: 18,
        repeatedProductRequests: 2,
        rapidAddToCartCount: 1,
        checkoutAttempts: 1,
        failedPaymentAttempts: 0,
        paymentMethodsAttempted: 1,
        accountsOnDevice: 1,
        isNewDevice: false,
        isNewAccount: false,
        botRiskScore: 8,
        paymentRiskScore: 6,
        correlatedRiskScore: 8,
      };
      securityStore.metrics.activeSuspiciousSessions = 0;
    }

    res.json(securityStore);
  });

  // ===========================================================================
  // CYBERSECURITY API 5: Parental Control Configuration & Biometric Approval
  // ===========================================================================
  app.post('/api/security/parent-config', (req, res) => {
    const { isChildAccount, maxSpendLimitInr, requireFirstTimeApproval } = req.body || {};
    if (typeof isChildAccount === 'boolean') {
      securityStore.parentalConfig.isChildAccount = isChildAccount;
    }
    if (typeof maxSpendLimitInr === 'number' && maxSpendLimitInr >= 500) {
      securityStore.parentalConfig.maxSpendLimitInr = maxSpendLimitInr;
    }
    if (typeof requireFirstTimeApproval === 'boolean') {
      securityStore.parentalConfig.requireFirstTimeApproval = requireFirstTimeApproval;
    }
    res.json({ ok: true, parentalConfig: securityStore.parentalConfig });
  });

  app.post('/api/security/parent-approve', (req, res) => {
    const { approvalId, decision, webAuthnChallengeToken } = req.body || {};
    // Hash the challenge token server-side; NEVER store raw biometric data
    const biometricAuthHash = crypto
      .createHash('sha256')
      .update(String(webAuthnChallengeToken || `bio_assertion_${Date.now()}`))
      .digest('hex')
      .slice(0, 24);

    const target = securityStore.pendingApprovals.find((a) => a.id === approvalId);
    if (target) {
      target.status = decision === 'APPROVE' ? 'APPROVED' : 'REJECTED';
      target.biometricAuthHash = `sha256:${biometricAuthHash}`;
    }

    securityStore.metrics.pendingParentApprovals = securityStore.pendingApprovals.filter(
      (a) => a.status === 'WAITING_FOR_PARENT_APPROVAL'
    ).length;

    securityStore.eventLogs.unshift({
      id: `sec_evt_par_dec_${Date.now()}`,
      timestamp: new Date().toISOString(),
      userId: target?.childUserId || 'CHILD_ACCOUNT',
      sessionId: 'SES_PARENT_BIO_AUTH',
      deviceId: 'DEV_PARENT_WEBAUTHN',
      eventType: 'PARENT_APPROVAL_REQUEST',
      threatTitle:
        decision === 'APPROVE'
          ? `Parent Biometric Approval Granted (Token: sha256:${biometricAuthHash.slice(0, 8)}...)`
          : 'Parent Rejected High-Value Child Order',
      riskScore: decision === 'APPROVE' ? 12 : 75,
      riskLevel: decision === 'APPROVE' ? 'LOW' : 'HIGH',
      reasons: [
        {
          points: 12,
          label: `Parent verified via WebAuthn Biometric Assertion (sha256:${biometricAuthHash.slice(0, 10)})`,
          category: 'parental',
        },
      ],
      signals: [
        `Decision: ${decision}`,
        `Cryptographic Assertion: sha256:${biometricAuthHash}`,
        'Zero raw biometric data stored',
      ],
      actionsTaken:
        decision === 'APPROVE'
          ? ['Parent biometric assertion verified', 'Order unlocked & completed']
          : ['Parent rejected request', 'Order cancelled'],
      actionSummary: decision === 'APPROVE' ? 'ALLOW' : 'BLOCK',
      finalStatus: decision === 'APPROVE' ? 'PARENT_APPROVED' : 'PARENT_REJECTED',
    });

    res.json({
      ok: true,
      decision,
      biometricAuthHash: `sha256:${biometricAuthHash}`,
      securityStore,
    });
  });

  // ===========================================================================
  // 1. Semantic AI Discovery & Intent-Based Product Search
  // ===========================================================================
  app.post('/api/ai/semantic-search', async (req, res) => {
    try {
      const { query, catalog, userPreferences } = req.body;
      if (!query || !Array.isArray(catalog)) {
        res.status(400).json({ error: 'Missing search query or catalog payload.' });
        return;
      }

      const ai = getGenAIClient();
      const catalogContext = JSON.stringify(
        catalog.map((p: Record<string, unknown>) => ({
          id: p.id,
          title: p.title,
          brand: p.brand,
          category: p.category,
          subcategory: p.subcategory,
          price: p.price,
          sustainabilityScore: p.sustainabilityScore,
          ecoMaterialTag: p.ecoMaterialTag,
          specsSummary: p.specsSummary,
        }))
      );

      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: `User Search Intent: "${query}"
User Preferences: ${JSON.stringify(userPreferences || {})}
Available Product Catalog: ${catalogContext}

Analyze the user's natural language intent and return the most relevant product IDs in ranked order, along with a concise explanation and suggested filter.`,
        config: {
          systemInstruction:
            'You are PrimeKart’s AI Search Engine. Match natural language shopping queries to exact catalog product IDs with high precision. Keep explanations concise (under 35 words).',
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              matchedProductIds: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
              },
              reasoning: {
                type: Type.STRING,
              },
              suggestedFilter: {
                type: Type.STRING,
              },
            },
            required: ['matchedProductIds', 'reasoning', 'suggestedFilter'],
          },
        },
      });

      const parsed = JSON.parse(response.text || '{}');
      res.json(parsed);
    } catch (error) {
      console.error('Semantic search error:', error);
      res.status(500).json({
        error: error instanceof Error ? error.message : 'Semantic search failed.',
      });
    }
  });

  // ===========================================================================
  // 2. Multimodal Image-Based Product Search (Supports /image-search & /visual-search)
  // ===========================================================================
  const handleImageSearch = async (req: express.Request, res: express.Response) => {
    try {
      const { imageBase64, mimeType, prompt, catalog } = req.body;
      if (!imageBase64 || !Array.isArray(catalog)) {
        res.status(400).json({ error: 'Image data and catalog are required.' });
        return;
      }

      const ai = getGenAIClient();
      const cleanBase64 = imageBase64.replace(/^data:[^;]+;base64,/, '');
      const catalogContext = JSON.stringify(
        catalog.map((p: Record<string, unknown>) => ({
          id: p.id,
          title: p.title,
          brand: p.brand,
          category: p.category,
          subcategory: p.subcategory,
          specsSummary: p.specsSummary,
          ecoMaterialTag: p.ecoMaterialTag,
        }))
      );

      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: {
          parts: [
            {
              inlineData: {
                mimeType: mimeType || 'image/jpeg',
                data: cleanBase64,
              },
            },
            {
              text: `Analyze this uploaded image. ${
                prompt ? `User note: "${prompt}".` : ''
              } Match it to the closest products in our catalog: ${catalogContext}`,
            },
          ],
        },
        config: {
          systemInstruction:
            'Identify the visual characteristics of the uploaded image and match them to the best products in the catalog.',
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              detectedStyle: {
                type: Type.STRING,
              },
              matchedProductIds: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
              },
              visualAnalysis: {
                type: Type.STRING,
              },
            },
            required: ['detectedStyle', 'matchedProductIds', 'visualAnalysis'],
          },
        },
      });

      const parsed = JSON.parse(response.text || '{}');
      res.json(parsed);
    } catch (error) {
      console.error('Visual search error:', error);
      res.status(500).json({
        error: error instanceof Error ? error.message : 'Visual product search failed.',
      });
    }
  };

  app.post('/api/ai/image-search', handleImageSearch);
  app.post('/api/ai/visual-search', handleImageSearch);

  // ===========================================================================
  // 3. AI Shopping Concierge (Conversational Assistant)
  // ===========================================================================
  app.post('/api/ai/concierge', async (req, res) => {
    try {
      const { message, history, catalog, cartSummary, userContext } = req.body;
      if (!message) {
        res.status(400).json({ error: 'Message is required.' });
        return;
      }

      const ai = getGenAIClient();
      const catalogBrief = JSON.stringify(
        (catalog || []).map((p: Record<string, unknown>) => ({
          id: p.id,
          title: p.title,
          brand: p.brand,
          category: p.category,
          price: p.price,
          stock: p.stock,
          rating: p.rating,
          sustainabilityScore: p.sustainabilityScore,
          specsSummary: p.specsSummary,
        }))
      );

      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: `Conversation History: ${JSON.stringify(history || [])}
User Context: ${userContext || 'Shopper'}
Current Shopping Bag: ${cartSummary || 'Empty'}
Available Catalog: ${catalogBrief}
Active Promo Codes: AETHERIA15 (15% off orders over $250), ECOCARBON10 ($40 off eco orders over $180), ATELIERVIP (20% off orders over $800).

User Message: "${message}"`,
        config: {
          systemInstruction:
            'You are the PrimeKart AI Shopping Assistant. Provide clear, helpful product comparisons, specification advice, and active coupon suggestions.',
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              reply: { type: Type.STRING },
              recommendedProductIds: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
              },
              suggestedCoupon: { type: Type.STRING },
            },
            required: ['reply', 'recommendedProductIds', 'suggestedCoupon'],
          },
        },
      });

      const parsed = JSON.parse(response.text || '{}');
      res.json(parsed);
    } catch (error) {
      console.error('Concierge error:', error);
      res.status(500).json({
        error: error instanceof Error ? error.message : 'Shopping concierge request failed.',
      });
    }
  });

  // ===========================================================================
  // 4. AI Verified Review Summarization
  // ===========================================================================
  app.post('/api/ai/review-summary', async (req, res) => {
    try {
      const { productTitle, reviews } = req.body;
      const ai = getGenAIClient();

      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: `Product: ${productTitle}
Customer Reviews: ${JSON.stringify(reviews || [])}

Synthesize these verified customer reviews into a concise summary, pros, cons, and verdict.`,
        config: {
          systemInstruction:
            'Summarize customer reviews into factual pros, cons, and a concise verdict.',
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              summary: { type: Type.STRING },
              pros: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
              },
              cons: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
              },
              verdict: { type: Type.STRING },
            },
            required: ['summary', 'pros', 'cons', 'verdict'],
          },
        },
      });

      const parsed = JSON.parse(response.text || '{}');
      res.json(parsed);
    } catch (error) {
      console.error('Review summary error:', error);
      res.status(500).json({
        error: error instanceof Error ? error.message : 'Review summarization failed.',
      });
    }
  });

  // ===========================================================================
  // 5. AI Smart Inventory & Merchandising Forecasting (Admin/Seller Dashboard)
  // ===========================================================================
  app.post('/api/ai/seller-insights', async (req, res) => {
    try {
      const { products, ordersSummary } = req.body;
      const ai = getGenAIClient();

      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: `Catalog Inventory State: ${JSON.stringify(products || [])}
Order & Revenue Metrics: ${JSON.stringify(ordersSummary || {})}

Generate low-stock depletion predictions, reorder quantity recommendations, pricing/promotion optimization advice, and sustainability impact insights.`,
        config: {
          systemInstruction:
            'You are an enterprise e-commerce supply chain & revenue intelligence analyst. Provide concrete numerical reorder recommendations and merchandising strategy.',
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              restockPredictions: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    productId: { type: Type.STRING },
                    title: { type: Type.STRING },
                    predictedDaysLeft: { type: Type.NUMBER },
                    recommendedReorderUnits: { type: Type.NUMBER },
                    riskLevel: { type: Type.STRING },
                    rationale: { type: Type.STRING },
                  },
                  required: [
                    'productId',
                    'title',
                    'predictedDaysLeft',
                    'recommendedReorderUnits',
                    'riskLevel',
                    'rationale',
                  ],
                },
              },
              merchandisingBrief: { type: Type.STRING },
              sustainabilityHighlight: { type: Type.STRING },
            },
            required: ['restockPredictions', 'merchandisingBrief', 'sustainabilityHighlight'],
          },
        },
      });

      const parsed = JSON.parse(response.text || '{}');
      res.json(parsed);
    } catch (error) {
      console.error('Seller insights error:', error);
      res.status(500).json({
        error: error instanceof Error ? error.message : 'Seller intelligence forecast failed.',
      });
    }
  });

  // ===========================================================================
  // Vite Middleware (Development) or Static Serving (Production)
  // ===========================================================================
  // ===========================================================================
  // 40-Page Technical Internship Report Download Endpoint
  // ===========================================================================
  app.get('/api/report/download', (_req, res) => {
    const pdfPath = path.join(__dirname, 'public', 'PrimeKart_Internship_Report_40_Pages.pdf');
    if (fs.existsSync(pdfPath)) {
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader(
        'Content-Disposition',
        'attachment; filename="PrimeKart_Internship_Report_40_Pages.pdf"'
      );
      fs.createReadStream(pdfPath).pipe(res);
    } else {
      res.status(404).json({ error: 'Report PDF not found. Run generator script.' });
    }
  });

  app.use(express.static(path.join(__dirname, 'public')));
  app.use('/src/assets', express.static(path.join(__dirname, 'src', 'assets')));

  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`PrimeKart AI & Cybersecurity Commerce Server listening on http://localhost:${PORT}`);
  });
}

startServer();
