import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import PDFDocument from 'pdfkit';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const OUTPUT_DIR = path.join(__dirname, '..', 'public');
if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

const PDF_PATH = path.join(OUTPUT_DIR, 'PrimeKart_Internship_Report_40_Pages.pdf');

console.log('Generating 40-page PDF report at:', PDF_PATH);

const doc = new PDFDocument({
  size: 'A4',
  autoFirstPage: false,
  margins: { top: 50, bottom: 50, left: 50, right: 50 },
  bufferPages: true,
});

const writeStream = fs.createWriteStream(PDF_PATH);
doc.pipe(writeStream);

const PAGE_WIDTH = 595.28;
const PAGE_HEIGHT = 841.89;
const MARGIN = 50;
const CONTENT_WIDTH = PAGE_WIDTH - MARGIN * 2;

// Colors
const COLOR_PRIMARY = '#0F172A'; // Slate 900
const COLOR_SECONDARY = '#1E293B'; // Slate 800
const COLOR_MUTED = '#64748B'; // Slate 500
const COLOR_LIGHT_BG = '#F8FAFC'; // Slate 50
const COLOR_BORDER = '#CBD5E1'; // Slate 300
const COLOR_ACCENT = '#0284C7'; // Sky 600

function drawPageHeader(doc, pageNum) {
  if (pageNum <= 4) return; // Skip cover, certificate, declaration, ack
  doc.save();
  doc.fontSize(7.5).fillColor(COLOR_MUTED).font('Helvetica');
  doc.text('PRIMEKART BY AETHERIA — AI-POWERED SECURE E-COMMERCE PLATFORM', MARGIN, 28, {
    width: CONTENT_WIDTH,
    align: 'left',
  });
  doc.text('INTERNSHIP REPORT', MARGIN, 28, {
    width: CONTENT_WIDTH,
    align: 'right',
  });
  doc.strokeColor(COLOR_BORDER).lineWidth(0.5);
  doc.moveTo(MARGIN, 38).lineTo(PAGE_WIDTH - MARGIN, 38).stroke();
  doc.restore();
}

function drawPageFooter(doc, pageNum, totalPages = 40) {
  doc.save();
  doc.strokeColor(COLOR_BORDER).lineWidth(0.5);
  doc.moveTo(MARGIN, PAGE_HEIGHT - 38).lineTo(PAGE_WIDTH - MARGIN, PAGE_HEIGHT - 38).stroke();
  doc.fontSize(8).fillColor(COLOR_MUTED).font('Helvetica');
  doc.text('Department of Computer Science & Engineering', MARGIN, PAGE_HEIGHT - 30, {
    width: CONTENT_WIDTH / 2,
    align: 'left',
  });
  doc.text(`Page ${pageNum} of ${totalPages}`, PAGE_WIDTH / 2, PAGE_HEIGHT - 30, {
    width: CONTENT_WIDTH / 2,
    align: 'right',
  });
  doc.restore();
}

function drawScreenshotBox(doc, y, height, label, caption, description) {
  doc.save();
  // Outer frame
  doc.roundedRect(MARGIN, y, CONTENT_WIDTH, height, 4).fillAndStroke(COLOR_LIGHT_BG, COLOR_BORDER);
  
  // Header bar inside box
  doc.rect(MARGIN, y, CONTENT_WIDTH, 20).fill('#E2E8F0');
  doc.fontSize(8).fillColor(COLOR_SECONDARY).font('Helvetica-Bold');
  doc.text(`[SCREENSHOT PLACEHOLDER: ${label}]`, MARGIN + 10, y + 6);
  
  // Center instruction
  doc.fontSize(9).fillColor(COLOR_MUTED).font('Helvetica-Oblique');
  doc.text('Capture and paste actual website screenshot here before final submission', MARGIN + 10, y + height / 2 - 6, {
    width: CONTENT_WIDTH - 20,
    align: 'center',
  });
  
  doc.restore();

  // Caption below box
  const captionY = y + height + 6;
  doc.fontSize(8.5).fillColor(COLOR_PRIMARY).font('Helvetica-Bold');
  doc.text(caption, MARGIN, captionY, { width: CONTENT_WIDTH });
  
  // Explanation text
  const descY = captionY + 13;
  doc.fontSize(8.5).fillColor(COLOR_SECONDARY).font('Helvetica');
  doc.text(description, MARGIN, descY, { width: CONTENT_WIDTH, lineGap: 2 });
  
  return descY + 45;
}

function drawTable(doc, startY, headers, rows, colWidths) {
  let currentY = startY;
  const rowHeight = 18;

  // Header row
  doc.rect(MARGIN, currentY, CONTENT_WIDTH, rowHeight).fill('#E2E8F0');
  doc.fontSize(8).font('Helvetica-Bold').fillColor(COLOR_PRIMARY);
  let curX = MARGIN + 5;
  headers.forEach((h, i) => {
    doc.text(h, curX, currentY + 5, { width: colWidths[i] - 10, align: 'left' });
    curX += colWidths[i];
  });
  currentY += rowHeight;

  // Rows
  doc.font('Helvetica').fontSize(7.8);
  rows.forEach((row, rIdx) => {
    const bg = rIdx % 2 === 0 ? '#FFFFFF' : '#F8FAFC';
    doc.rect(MARGIN, currentY, CONTENT_WIDTH, rowHeight).fillAndStroke(bg, '#E2E8F0');
    doc.fillColor(COLOR_SECONDARY);
    let rx = MARGIN + 5;
    row.forEach((cell, cIdx) => {
      doc.text(String(cell), rx, currentY + 5, { width: colWidths[cIdx] - 10, align: 'left' });
      rx += colWidths[cIdx];
    });
    currentY += rowHeight;
  });

  return currentY + 10;
}

// =============================================================================
// 40 PAGE DEFINITIONS
// =============================================================================

const pages = [];

// -----------------------------------------------------------------------------
// PAGE 1: COVER PAGE
// -----------------------------------------------------------------------------
pages.push((doc) => {
  doc.roundedRect(25, 25, PAGE_WIDTH - 50, PAGE_HEIGHT - 50, 4).lineWidth(1.5).strokeColor(COLOR_PRIMARY).stroke();
  doc.roundedRect(29, 29, PAGE_WIDTH - 58, PAGE_HEIGHT - 58, 2).lineWidth(0.5).strokeColor(COLOR_MUTED).stroke();

  doc.fontSize(10).font('Helvetica-Bold').fillColor(COLOR_MUTED).text('A TECHNICAL INTERNSHIP REPORT', MARGIN, 55, { align: 'center' });
  doc.fontSize(9).font('Helvetica').fillColor(COLOR_MUTED).text('ON', MARGIN, 70, { align: 'center' });

  doc.fontSize(18).font('Helvetica-Bold').fillColor(COLOR_PRIMARY).text('DESIGN AND DEVELOPMENT OF AN AI-POWERED SECURE E-COMMERCE PLATFORM', MARGIN, 90, { align: 'center', lineGap: 3 });
  doc.fontSize(14).font('Helvetica-Bold').fillColor(COLOR_ACCENT).text('(PRIMEKART BY AETHERIA)', MARGIN, 138, { align: 'center' });

  doc.fontSize(9.5).font('Helvetica').fillColor(COLOR_SECONDARY).text('Submitted in partial fulfillment of the requirements for the award of the degree of\nBACHELOR OF TECHNOLOGY / ENGINEERING\nIN\nCOMPUTER SCIENCE AND ENGINEERING / INFORMATION TECHNOLOGY', MARGIN, 175, { align: 'center', lineGap: 3 });

  // Placeholders for logos
  doc.roundedRect(MARGIN + 60, 245, 110, 70, 3).fillAndStroke('#F1F5F9', COLOR_BORDER);
  doc.fontSize(8).fillColor(COLOR_MUTED).font('Helvetica').text('[COLLEGE LOGO\nPLACEHOLDER]', MARGIN + 60, 268, { width: 110, align: 'center' });

  doc.roundedRect(PAGE_WIDTH - MARGIN - 170, 245, 110, 70, 3).fillAndStroke('#F1F5F9', COLOR_BORDER);
  doc.fontSize(8).fillColor(COLOR_MUTED).font('Helvetica').text('[COMPANY LOGO\nPLACEHOLDER]', PAGE_WIDTH - MARGIN - 170, 268, { width: 110, align: 'center' });

  doc.fontSize(9.5).font('Helvetica-Bold').fillColor(COLOR_PRIMARY).text('Submitted by:', MARGIN + 40, 350);
  doc.fontSize(10).font('Helvetica').fillColor(COLOR_SECONDARY).text('[STUDENT NAME]\nRegister No: [REGISTER NUMBER]\nDegree: B.Tech / B.E. (CSE / IT)', MARGIN + 40, 368, { lineGap: 3 });

  doc.fontSize(9.5).font('Helvetica-Bold').fillColor(COLOR_PRIMARY).text('Under the Guidance of:', MARGIN + 280, 350);
  doc.fontSize(10).font('Helvetica').fillColor(COLOR_SECONDARY).text('[FACULTY GUIDE NAME]\n[DESIGNATION]\nDepartment of [DEPARTMENT]', MARGIN + 280, 368, { lineGap: 3 });

  doc.rect(MARGIN + 30, 440, CONTENT_WIDTH - 60, 110).fillAndStroke(COLOR_LIGHT_BG, COLOR_BORDER);
  doc.fontSize(10).font('Helvetica-Bold').fillColor(COLOR_PRIMARY).text('INTERNSHIP DETAILS', MARGIN + 30, 452, { align: 'center' });
  doc.fontSize(9).font('Helvetica').fillColor(COLOR_SECONDARY).text('Organization: [INTERNSHIP ORGANIZATION / COMPANY NAME]\nLocation: [COMPANY LOCATION]\nDuration: [START DATE] TO [END DATE]\nDomain: Full-Stack Web Development & Cybersecurity Integration\nPlatform: Google AI Studio, React 19, TypeScript, Express, Firebase', MARGIN + 45, 472, { lineGap: 3 });

  doc.fontSize(10).font('Helvetica-Bold').fillColor(COLOR_PRIMARY).text('DEPARTMENT OF COMPUTER SCIENCE AND ENGINEERING', MARGIN, 610, { align: 'center' });
  doc.fontSize(11).font('Helvetica-Bold').fillColor(COLOR_SECONDARY).text('[NAME OF THE COLLEGE / INSTITUTION]', MARGIN, 626, { align: 'center' });
  doc.fontSize(9).font('Helvetica').fillColor(COLOR_MUTED).text('[AFFILIATED UNIVERSITY / CAMPUS ADDRESS]\nACADEMIC YEAR: 2025–2026', MARGIN, 642, { align: 'center', lineGap: 2 });
});

// -----------------------------------------------------------------------------
// PAGE 2: BONAFIDE CERTIFICATE
// -----------------------------------------------------------------------------
pages.push((doc) => {
  doc.roundedRect(35, 35, PAGE_WIDTH - 70, PAGE_HEIGHT - 70, 4).lineWidth(1).strokeColor(COLOR_BORDER).stroke();
  doc.fontSize(13).font('Helvetica-Bold').fillColor(COLOR_PRIMARY).text('[NAME OF THE INSTITUTION]', MARGIN, 65, { align: 'center' });
  doc.fontSize(10).font('Helvetica-Bold').fillColor(COLOR_SECONDARY).text('DEPARTMENT OF COMPUTER SCIENCE AND ENGINEERING', MARGIN, 82, { align: 'center' });
  doc.fontSize(9).font('Helvetica').fillColor(COLOR_MUTED).text('[COLLEGE LOCATION & PINCODE]', MARGIN, 97, { align: 'center' });

  doc.fontSize(14).font('Helvetica-Bold').fillColor(COLOR_PRIMARY).text('BONAFIDE CERTIFICATE', MARGIN, 130, { align: 'center' });
  doc.moveTo(MARGIN + 120, 147).lineTo(PAGE_WIDTH - MARGIN - 120, 147).strokeColor(COLOR_PRIMARY).lineWidth(1).stroke();

  doc.fontSize(10).font('Helvetica').fillColor(COLOR_SECONDARY).text(
    `This is to certify that this internship report entitled "DESIGN AND DEVELOPMENT OF AN AI-POWERED SECURE E-COMMERCE PLATFORM (PRIMEKART BY AETHERIA)" is the bonafide work carried out by [STUDENT NAME] (Register Number: [REGISTER NUMBER]), a bonafide student of [NAME OF COLLEGE] in partial fulfillment of the requirements for the award of the degree of Bachelor of Engineering / Technology in [DEPARTMENT NAME] during the academic year 2025–2026.\n\nThe student underwent a practical web development internship at [INTERNSHIP ORGANIZATION NAME] from [START DATE] to [END DATE] and successfully completed the assigned project work on full-stack web application development, cloud database integration, and AI-driven cybersecurity telemetry under our supervision.\n\nCertified further that to the best of our knowledge the work reported herein does not form part of any other project or dissertation on the basis of which a degree or award was conferred on an earlier occasion on this or any other candidate.`,
    MARGIN + 20, 180, { width: CONTENT_WIDTH - 40, align: 'justify', lineGap: 6 }
  );

  const sigY = 530;
  doc.fontSize(9.5).font('Helvetica-Bold').fillColor(COLOR_PRIMARY);
  doc.text('______________________', MARGIN + 20, sigY);
  doc.text('Internal Guide', MARGIN + 20, sigY + 16);
  doc.fontSize(8.5).font('Helvetica').fillColor(COLOR_MUTED);
  doc.text('[Guide Name & Designation]\nDept. of CSE', MARGIN + 20, sigY + 28);

  doc.fontSize(9.5).font('Helvetica-Bold').fillColor(COLOR_PRIMARY);
  doc.text('______________________', MARGIN + 180, sigY);
  doc.text('Head of Department', MARGIN + 180, sigY + 16);
  doc.fontSize(8.5).font('Helvetica').fillColor(COLOR_MUTED);
  doc.text('[HOD Name & Designation]\nDept. of CSE & IT', MARGIN + 180, sigY + 28);

  doc.fontSize(9.5).font('Helvetica-Bold').fillColor(COLOR_PRIMARY);
  doc.text('______________________', MARGIN + 340, sigY);
  doc.text('Company / External Mentor', MARGIN + 340, sigY + 16);
  doc.fontSize(8.5).font('Helvetica').fillColor(COLOR_MUTED);
  doc.text('[Mentor Name & Role]\n[Company Seal]', MARGIN + 340, sigY + 28);

  doc.rect(MARGIN + 20, 640, CONTENT_WIDTH - 40, 50).fillAndStroke(COLOR_LIGHT_BG, COLOR_BORDER);
  doc.fontSize(9).font('Helvetica-Bold').fillColor(COLOR_PRIMARY).text('Viva-Voce Examination held on: ________________________', MARGIN + 35, 650);
  doc.fontSize(9).font('Helvetica').fillColor(COLOR_SECONDARY).text('Internal Examiner: _______________________      External Examiner: _______________________', MARGIN + 35, 670);
});

// -----------------------------------------------------------------------------
// PAGE 3: DECLARATION
// -----------------------------------------------------------------------------
pages.push((doc) => {
  doc.fontSize(14).font('Helvetica-Bold').fillColor(COLOR_PRIMARY).text('CANDIDATE DECLARATION', MARGIN, 70, { align: 'center' });
  doc.moveTo(MARGIN + 140, 87).lineTo(PAGE_WIDTH - MARGIN - 140, 87).strokeColor(COLOR_PRIMARY).lineWidth(1).stroke();

  doc.fontSize(10).font('Helvetica').fillColor(COLOR_SECONDARY).text(
    `I, [STUDENT NAME], student of Bachelor of Technology / Engineering in [DEPARTMENT NAME], Register Number: [REGISTER NUMBER], hereby declare that the internship report entitled "DESIGN AND DEVELOPMENT OF AN AI-POWERED SECURE E-COMMERCE PLATFORM (PRIMEKART BY AETHERIA)" submitted to [COLLEGE NAME] is a genuine record of the internship work and software engineering project carried out by me under the supervision of my faculty guide [FACULTY GUIDE NAME] and industry mentor [INDUSTRY MENTOR NAME] at [COMPANY / INTERNSHIP ORGANIZATION NAME].\n\nI confirm that the software deliverables, component implementations, Firestore database rules, Explainable AI Risk heuristics, and verification test cases documented in this report represent actual practical development performed by me during the internship period.\n\nI further declare that this report has not previously formed the basis for the award of any Degree, Diploma, Associateship, Fellowship, or any other similar title in this or any other university or higher education institution. All referenced tools, frameworks, and third-party packages have been cited appropriately.`,
    MARGIN + 20, 130, { width: CONTENT_WIDTH - 40, align: 'justify', lineGap: 6 }
  );

  const signY = 460;
  doc.fontSize(9.5).font('Helvetica').fillColor(COLOR_SECONDARY);
  doc.text('Place: [CITY / CAMPUS]', MARGIN + 20, signY);
  doc.text('Date:  [DATE OF SUBMISSION]', MARGIN + 20, signY + 18);

  doc.text('_____________________________________', PAGE_WIDTH - MARGIN - 210, signY);
  doc.fontSize(10).font('Helvetica-Bold').fillColor(COLOR_PRIMARY);
  doc.text('[STUDENT NAME]', PAGE_WIDTH - MARGIN - 210, signY + 16);
  doc.fontSize(9).font('Helvetica').fillColor(COLOR_MUTED);
  doc.text('Register No: [REGISTER NUMBER]\nDept. of [DEPARTMENT]\n[COLLEGE NAME]', PAGE_WIDTH - MARGIN - 210, signY + 28, { lineGap: 2 });
});

// -----------------------------------------------------------------------------
// PAGE 4: ACKNOWLEDGEMENT
// -----------------------------------------------------------------------------
pages.push((doc) => {
  doc.fontSize(14).font('Helvetica-Bold').fillColor(COLOR_PRIMARY).text('ACKNOWLEDGEMENT', MARGIN, 70, { align: 'center' });
  doc.moveTo(MARGIN + 160, 87).lineTo(PAGE_WIDTH - MARGIN - 160, 87).strokeColor(COLOR_PRIMARY).lineWidth(1).stroke();

  doc.fontSize(9.8).font('Helvetica').fillColor(COLOR_SECONDARY).text(
    `First and foremost, I express my sincere gratitude to the Almighty for granting me the perseverance, health, and wisdom required to complete this technical internship and project successfully.\n\nI convey my respectful thanks to our respected Principal, [PRINCIPAL NAME], for maintaining an inspiring academic environment and providing excellent technical laboratory resources that enabled me to pursue industry-oriented project work.\n\nI express my profound gratitude to [HOD NAME], Head of the Department of [DEPARTMENT NAME], for their continuous encouragement, administrative support, and permission to undertake this practical internship.\n\nI am deeply indebted to my Faculty Guide, [FACULTY GUIDE NAME], [DESIGNATION], for constructive reviews, patience, and valuable suggestions during the design, coding, and reporting stages of this project.\n\nI extend my heartfelt thanks to the executive management and software engineering teams at [INTERNSHIP ORGANIZATION NAME] for offering me this valuable internship experience. I am particularly grateful to my industry mentor, [MENTOR NAME], for practical guidance on modern React architectures, server-side security proxies, and zero-trust engineering.\n\nFinally, I express my deepest affection and appreciation to my parents, family members, and friends whose unwavering moral and financial support motivated me throughout this journey.`,
    MARGIN + 20, 130, { width: CONTENT_WIDTH - 40, align: 'justify', lineGap: 6 }
  );

  doc.fontSize(10).font('Helvetica-Bold').fillColor(COLOR_PRIMARY);
  doc.text('[STUDENT NAME]', PAGE_WIDTH - MARGIN - 180, 520);
  doc.fontSize(9).font('Helvetica').fillColor(COLOR_MUTED);
  doc.text('Register No: [REGISTER NUMBER]', PAGE_WIDTH - MARGIN - 180, 536);
});

// -----------------------------------------------------------------------------
// PAGE 5: ABSTRACT
// -----------------------------------------------------------------------------
pages.push((doc) => {
  doc.fontSize(14).font('Helvetica-Bold').fillColor(COLOR_PRIMARY).text('PROJECT ABSTRACT', MARGIN, 65, { align: 'center' });
  doc.moveTo(MARGIN + 160, 82).lineTo(PAGE_WIDTH - MARGIN - 160, 82).strokeColor(COLOR_PRIMARY).lineWidth(1).stroke();

  doc.fontSize(9.5).font('Helvetica').fillColor(COLOR_SECONDARY).text(
    `During my web development internship, I engineered PrimeKart (by Aetheria), a full-stack, AI-powered, and zero-trust secure e-commerce web application. Modern online retail platforms face dual engineering challenges: consumers demand fluid, multi-currency shopping with instant cross-device handoffs, while merchants face escalating cyber threats including automated scalping bots, payment credential cycling, account takeovers, and inadvertent child spending on shared family devices.\n\nTo solve these challenges in a single cohesive system, PrimeKart combines an enterprise commercial storefront with a server-authoritative Explainable AI Risk and Cybersecurity Engine. The storefront was developed using React 19, TypeScript, and Tailwind CSS, featuring catalog browsing across luxury categories (Audio & Acoustics, Architectural Living, Botanical Formulation, Precision Horology), multi-currency recalculation (USD, INR, EUR, GBP), dynamic trade-in valuations, postal pincode delivery estimation, verified customer review publication, and cross-device mobile handoff via on-demand vector SVG QR code generation.\n\nOn the backend, an Express server hosts the cybersecurity telemetry store and connects to Google Gemini (gemini-3.8-flash) via the official @google/genai SDK. Rather than relying on black-box heuristics, the security layer computes an Explainable Risk Score (0–100) based on live telemetry signals: request velocity, repetitive product polling, rapid add-to-cart bursts, multiple payment failure retries, and multi-account device sharing. Transactions are automatically triaged into ALLOW (<30 risk), VERIFY OTP (31–70 risk), or BLOCK (>70 risk). For families, configurable parental spend ceilings (e.g., ₹2,000) intercept child orders for simulated biometric assertions.\n\nAll persistent data (orders, user roles, reviews) is managed using Google Firebase Authentication and Cloud Firestore, backed by zero-trust security rules (firestore.rules) that strictly prevent unauthorized data listing and enforce Role-Based Access Control (RBAC). Standard customers and sellers cannot access or view the administrative Security Operations Center (SOC). Comprehensive functional, security, and responsive testing verified that PrimeKart achieves sub-second reactivity, high mobile accessibility, and robust resistance to automated e-commerce abuse.`,
    MARGIN + 10, 110, { width: CONTENT_WIDTH - 20, align: 'justify', lineGap: 4.5 }
  );

  doc.rect(MARGIN + 10, 620, CONTENT_WIDTH - 20, 65).fillAndStroke(COLOR_LIGHT_BG, COLOR_BORDER);
  doc.fontSize(8.5).font('Helvetica-Bold').fillColor(COLOR_PRIMARY).text('Key Project Highlights & Technical Keywords:', MARGIN + 20, 630);
  doc.fontSize(8).font('Helvetica').fillColor(COLOR_SECONDARY).text(
    '• Frontend: React 19, TypeScript, Tailwind CSS 4, Lucide Icons, Vite Bundler\n• Backend & Database: Express 4.21, Node.js, Google Firebase Authentication, Cloud Firestore\n• AI & Intelligence: Google Gemini 3.8 Flash (@google/genai), Multimodal Search, Review Synthesizer\n• Cybersecurity: Explainable AI Risk Engine (0-100), Scalping Bot Detection, Zero-Trust RBAC, QR Handoff',
    MARGIN + 20, 646, { lineGap: 3 }
  );
});

// -----------------------------------------------------------------------------
// PAGE 6: TABLE OF CONTENTS
// -----------------------------------------------------------------------------
pages.push((doc) => {
  doc.fontSize(14).font('Helvetica-Bold').fillColor(COLOR_PRIMARY).text('TABLE OF CONTENTS', MARGIN, 65, { align: 'center' });
  doc.moveTo(MARGIN + 150, 82).lineTo(PAGE_WIDTH - MARGIN - 150, 82).strokeColor(COLOR_PRIMARY).lineWidth(1).stroke();

  const toc = [
    { title: 'Cover Page', page: '1', level: 0 },
    { title: 'Bonafide Certificate', page: '2', level: 0 },
    { title: 'Candidate Declaration', page: '3', level: 0 },
    { title: 'Acknowledgement', page: '4', level: 0 },
    { title: 'Project Abstract', page: '5', level: 0 },
    { title: 'Table of Contents', page: '6', level: 0 },
    { title: 'CHAPTER 1: INTERNSHIP AND PROJECT INTRODUCTION', page: '7', level: 1 },
    { title: '1.1 Internship Overview & Organizational Learning', page: '7', level: 2 },
    { title: '1.2 Project Introduction & Problem Definition', page: '8', level: 2 },
    { title: '1.3 Practical Project Objectives Matrix', page: '9', level: 2 },
    { title: 'CHAPTER 2: REQUIREMENTS AND TECHNOLOGY STACK', page: '10', level: 1 },
    { title: '2.1 Functional and Non-Functional Requirements', page: '10', level: 2 },
    { title: '2.2 Verified Technology Stack & Library Justification', page: '11', level: 2 },
    { title: '2.3 Development Environment & AI Studio Iterative Workflow', page: '12', level: 2 },
    { title: 'CHAPTER 3: SYSTEM DESIGN AND ARCHITECTURE', page: '13', level: 1 },
    { title: '3.1 High-Level Zero-Trust Architecture Diagram', page: '13', level: 2 },
    { title: '3.2 End-to-End User Journey & Transaction Lifecycle', page: '14', level: 2 },
    { title: '3.3 Cloud Firestore Data Modeling & Collection Hierarchies', page: '15', level: 2 },
    { title: 'CHAPTER 4: FRONTEND STOREFRONT IMPLEMENTATION', page: '16', level: 1 },
    { title: '4.1 Home Page Showcase & Minimalist Navigation', page: '16', level: 2 },
    { title: '4.2 Catalog Grid, Currency Conversions & Sorting Mechanics', page: '17', level: 2 },
    { title: '4.3 Product Detail Modal, Trade-in & Cross-Device QR Handoff', page: '18', level: 2 },
    { title: '4.4 Google OAuth Authentication & Role Switching Mechanism', page: '19', level: 2 },
    { title: '4.5 Persistent Slide-Out Shopping Cart & Dynamic Coupon Engine', page: '20', level: 2 },
    { title: '4.6 Multi-Option Checkout (UPI QR, Card, COD) & Orders View', page: '21', level: 2 },
    { title: 'CHAPTER 5: CYBERSECURITY & FRAUD DETECTION ENGINES', page: '22', level: 1 },
    { title: '5.1 Zero-Trust Transaction Pipeline & Threat Modeling', page: '22', level: 2 },
    { title: '5.2 Explainable AI Risk Engine (0-100 Score Breakdown)', page: '23', level: 2 },
    { title: '5.3 Card Credential Stuffing & Payment Anomaly Detection', page: '24', level: 2 },
    { title: '5.4 Scalping Bot Detection & Request Velocity Throttling', page: '25', level: 2 },
    { title: '5.5 Parental Guardian Spend Limits & Biometric Protection', page: '26', level: 2 },
    { title: '5.6 Prompt Injection Containment & Sensitive Data Isolation', page: '27', level: 2 },
    { title: '5.7 Role-Based Access Control (RBAC) & SOC Security Masking', page: '28', level: 2 },
    { title: 'CHAPTER 6: ARTIFICIAL INTELLIGENCE INTEGRATION', page: '29', level: 1 },
    { title: '6.1 Practical Gemini 3.8 Flash Implementation via @google/genai', page: '29', level: 2 },
    { title: '6.2 Prompt Engineering, Structured JSON Schemas & Type Safety', page: '30', level: 2 },
    { title: 'CHAPTER 7: SYSTEM VERIFICATION AND TESTING', page: '31', level: 1 },
    { title: '7.1 Functional Test Cases & Validation Matrix', page: '31', level: 2 },
    { title: '7.2 Security Attack Simulations & Threat Mitigation Tests', page: '32', level: 2 },
    { title: '7.3 Cross-Device Responsive Testing (Mobile, Tablet, Desktop)', page: '33', level: 2 },
    { title: '7.4 Real-World Defect Resolution & Bug Tracking Log', page: '34', level: 2 },
    { title: 'CHAPTER 8: ENGINEERING REFLECTIONS & CHALLENGES', page: '35', level: 1 },
    { title: '8.1 Technical Challenges Faced During Development', page: '35', level: 2 },
    { title: '8.2 Architectural Solutions & Implementation Refinements', page: '36', level: 2 },
    { title: '8.3 Complete System Visual Showcase', page: '37', level: 2 },
    { title: 'CHAPTER 9: RESULTS, CONCLUSION & REFERENCES', page: '38', level: 1 },
    { title: '9.1 Project Deliverables & Final Outcomes', page: '38', level: 2 },
    { title: '9.2 Student Learning Outcomes & Planned Future Work', page: '39', level: 2 },
    { title: '9.3 Technical References & Documentation Standards', page: '40', level: 2 },
  ];

  let y = 100;
  toc.forEach((item) => {
    if (item.level === 1) {
      doc.font('Helvetica-Bold').fontSize(8.5).fillColor(COLOR_PRIMARY);
      doc.text(item.title, MARGIN, y, { width: CONTENT_WIDTH - 30 });
      doc.text(item.page, PAGE_WIDTH - MARGIN - 25, y, { width: 25, align: 'right' });
      y += 15;
    } else if (item.level === 2) {
      doc.font('Helvetica').fontSize(8).fillColor(COLOR_SECONDARY);
      doc.text('    ' + item.title, MARGIN, y, { width: CONTENT_WIDTH - 30 });
      doc.fillColor(COLOR_MUTED).text(item.page, PAGE_WIDTH - MARGIN - 25, y, { width: 25, align: 'right' });
      y += 13.5;
    } else {
      doc.font('Helvetica').fontSize(8).fillColor(COLOR_MUTED);
      doc.text(item.title, MARGIN, y, { width: CONTENT_WIDTH - 30 });
      doc.text(item.page, PAGE_WIDTH - MARGIN - 25, y, { width: 25, align: 'right' });
      y += 13.5;
    }
  });
});

// Helper for generic chapter pages
function addGenericTextPage(title, chapter, sections) {
  pages.push((doc) => {
    doc.fontSize(9).font('Helvetica-Bold').fillColor(COLOR_ACCENT).text(chapter.toUpperCase(), MARGIN, 52);
    doc.fontSize(14).font('Helvetica-Bold').fillColor(COLOR_PRIMARY).text(title, MARGIN, 66);
    doc.moveTo(MARGIN, 84).lineTo(PAGE_WIDTH - MARGIN, 84).strokeColor(COLOR_BORDER).lineWidth(0.5).stroke();

    let curY = 96;
    sections.forEach((sec) => {
      if (sec.type === 'heading') {
        doc.fontSize(10.5).font('Helvetica-Bold').fillColor(COLOR_PRIMARY).text(sec.text, MARGIN, curY);
        curY += 16;
      } else if (sec.type === 'paragraph') {
        doc.fontSize(8.5).font('Helvetica').fillColor(COLOR_SECONDARY).text(sec.text, MARGIN, curY, {
          width: CONTENT_WIDTH,
          align: 'justify',
          lineGap: 3,
        });
        curY += doc.heightOfString(sec.text, { width: CONTENT_WIDTH, lineGap: 3 }) + 10;
      } else if (sec.type === 'bullets') {
        sec.items.forEach((item) => {
          doc.fontSize(8.5).font('Helvetica').fillColor(COLOR_SECONDARY).text(`•  ${item}`, MARGIN + 10, curY, {
            width: CONTENT_WIDTH - 20,
            align: 'justify',
            lineGap: 2.5,
          });
          curY += doc.heightOfString(`•  ${item}`, { width: CONTENT_WIDTH - 20, lineGap: 2.5 }) + 4;
        });
        curY += 6;
      } else if (sec.type === 'screenshot') {
        curY = drawScreenshotBox(doc, curY, sec.height || 140, sec.label, sec.caption, sec.description);
      } else if (sec.type === 'table') {
        curY = drawTable(doc, curY, sec.headers, sec.rows, sec.widths);
      } else if (sec.type === 'diagram') {
        doc.rect(MARGIN, curY, CONTENT_WIDTH, sec.height || 90).fillAndStroke(COLOR_LIGHT_BG, COLOR_BORDER);
        doc.fontSize(7.5).font('Courier').fillColor(COLOR_PRIMARY).text(sec.content, MARGIN + 10, curY + 10, {
          width: CONTENT_WIDTH - 20,
          lineGap: 2,
        });
        curY += (sec.height || 90) + 12;
      }
    });
  });
}

// -----------------------------------------------------------------------------
// PAGES 7 - 40: CONTENT PAGES
// -----------------------------------------------------------------------------

// PAGE 7: Internship Overview
addGenericTextPage('1.1 Internship Overview & Learning', 'Chapter 1: Introduction', [
  { type: 'paragraph', text: 'During my internship as a Full-Stack Web Development Intern, I engaged directly in designing, architecting, building, and verifying production-grade web applications. The internship focused on bridging modern single-page frontend frameworks with cloud databases, serverless proxy architectures, and emerging AI technologies.' },
  { type: 'heading', text: 'Core Responsibilities and Engineering Scope:' },
  { type: 'bullets', items: [
    'Modular UI Architecture: Creating reusable React 19 functional components utilizing Tailwind CSS 4 for responsive, high-contrast digital commerce interfaces.',
    'State & Session Persistence: Managing client-side cart and wishlist state via browser localStorage while synchronizing shared catalogs and order histories with Cloud Firestore.',
    'API Proxy & Secret Vaulting: Implementing Node.js/Express server middlewares to proxy third-party AI requests and prevent exposure of credentials in client bundles.',
    'Explainable Cybersecurity Integration: Formulating heuristic and mathematical risk algorithms that inspect client request velocity, repeated product polling, and payment anomalies.',
    'Automated Quality Assurance: Running continuous type-checking via tsc --noEmit and build compilation to guarantee clean error-free execution across all viewports.'
  ]},
  { type: 'heading', text: 'Engineering Methodology Workflow:' },
  { type: 'diagram', height: 110, content: `+-----------------------------------------------------------------------------+
| [Functional Requirement / Brief]                                            |
|        |                                                                    |
|        v                                                                    |
| [Google AI Studio Specification] ---> [TypeScript Architecture Design]      |
|                                                     |                       |
|                                                     v                       |
| [Cloud Firestore Schema & Rules] <--- [React 19 Frontend Components]        |
|        |                                                                    |
|        v                                                                    |
| [Express Server Risk Middleware] ---> [tsc / Vite Build Check] -> [Deploy]  |
+-----------------------------------------------------------------------------+` }
]);

// PAGE 8: Project Introduction
addGenericTextPage('1.2 Project Introduction & Scope', 'Chapter 1: Introduction', [
  { type: 'paragraph', text: 'PrimeKart (by Aetheria) was developed to demonstrate how digital commerce platforms can move beyond passive transactional catalogs into intelligent, zero-trust shopping environments. In standard retail implementations, checkout flows operate under implicit trust, leaving merchants exposed to automated scalping scripts, payment cycling attacks, and unauthorized juvenile spending.' },
  { type: 'paragraph', text: 'PrimeKart introduces a multi-tier commercial platform designed for three key stakeholders: standard consumers searching for lifestyle products, sellers managing store inventory, and security administrators auditing automated transactions through an embedded Security Operations Center (SOC).' },
  { type: 'screenshot', height: 160, label: 'Main Storefront Home Page', caption: 'Figure 1.1: PrimeKart Storefront Home Page Interface', description: 'The home page displays the brand header, currency switcher, category navigation, real-time voice and visual search inputs, and the architectural living collection banner.' }
]);

// PAGE 9: Project Objectives
addGenericTextPage('1.3 Project Objectives Matrix', 'Chapter 1: Introduction', [
  { type: 'paragraph', text: 'To ensure a focused development lifecycle, clear technical milestones were established across functional e-commerce capabilities, security enforcement, and AI intelligence.' },
  { type: 'table', headers: ['Objective Area', 'Specific Technical Milestone', 'Engineering Realization'], widths: [110, 190, 195], rows: [
    ['Digital Commerce', 'Deliver end-to-end shopping workflow', 'Product catalog, reactive cart drawer, live price calculations, coupon engine, order tracking.'],
    ['Mobile Usability', 'Enable cross-device desktop-to-phone handoff', 'Vector SVG QR code generator in product modal with deep-linking (?product=<id>).'],
    ['Authentication', 'Multi-role user sign-in with Firestore sync', 'Google OAuth popup sign-in, user document bootstrapping, Customer/Seller/Admin RBAC.'],
    ['Cybersecurity', 'Detect and contain automated checkout attacks', 'Explainable AI Risk Engine (0-100 score) evaluating velocity, payment fails, and device sharing.'],
    ['Family Protection', 'Prevent unauthorized child spend on shared devices', 'Configurable spend limits (₹2,000) with simulated parent biometric assertion demo.'],
    ['Artificial Intelligence', 'Augment retail discovery and sentiment review', 'Google Gemini 3.8 Flash SDK for review synthesis and multimodal image search.']
  ]},
  { type: 'paragraph', text: 'Each objective was verified against concrete test cases, ensuring that no experimental features impaired the core purchasing journey.' }
]);

// PAGE 10: Requirements
addGenericTextPage('2.1 Requirements Specification', 'Chapter 2: Requirements & Tech', [
  { type: 'paragraph', text: 'System requirements were divided into functional capabilities (features directly executed by users) and non-functional engineering standards (reliability, security, responsiveness).' },
  { type: 'table', headers: ['Req ID', 'Category', 'Specification Description', 'Verification Status'], widths: [55, 90, 240, 110], rows: [
    ['FR-01', 'Functional', 'Catalog browsing, department filtering, sorting by price/rating.', 'Verified in Storefront'],
    ['FR-02', 'Functional', 'Product detail modal with specs, trade-in, and mobile QR code.', 'Verified in Modal'],
    ['FR-03', 'Functional', 'Slide-out cart drawer with quantity adjustment and coupon discounts.', 'Verified in Cart Drawer'],
    ['FR-04', 'Functional', 'Google OAuth identity login with automatic profile creation.', 'Verified in Auth'],
    ['FR-05', 'Functional', 'Admin seller hub for product inventory and coupon creation.', 'Verified in Dashboard'],
    ['FR-06', 'Functional', 'Server-authoritative risk engine scoring transactions 0 to 100.', 'Verified in Express API'],
    ['FR-07', 'Functional', 'AI review summarizer generating sentiment, pros, cons, and verdict.', 'Verified via Gemini SDK'],
    ['NFR-01', 'Non-Functional', 'Zero-trust Firestore security rules isolating private PII.', 'Enforced in rules'],
    ['NFR-02', 'Non-Functional', 'Sub-second UI state reactivity using React 19 hooks.', 'Verified clean build'],
    ['NFR-03', 'Non-Functional', 'Fluid responsive layout across 375px mobile to 1440px desktop.', 'Verified in Tailwind']
  ]},
  { type: 'paragraph', text: 'All functional requirements were bound by strict TypeScript contracts in src/types.ts to prevent null pointer exceptions.' }
]);

// PAGE 11: Technology Stack
addGenericTextPage('2.2 Verified Technology Stack', 'Chapter 2: Requirements & Tech', [
  { type: 'paragraph', text: 'Every framework, runtime, and cloud library in the project was selected for architectural stability, safety, and modern performance.' },
  { type: 'table', headers: ['Technology', 'Version', 'Role in Architecture', 'Implementation File Location'], widths: [95, 55, 195, 150], rows: [
    ['React', '19.0.1', 'Functional component UI layer & reactive hooks', 'src/App.tsx, src/components/*'],
    ['TypeScript', '7.0.2', 'Static type safety, interfaces, strict compilation', 'src/types.ts, tsconfig.json'],
    ['Tailwind CSS', '4.3.3', 'Utility styling, fluid typography, responsive layout', 'src/index.css, component classes'],
    ['Express', '4.21.2', 'Node.js backend proxy server & security store', 'server.ts (Port 3000)'],
    ['Firebase Auth', '12.19.0', 'Google identity provider popup authentication', 'src/firebase.ts'],
    ['Cloud Firestore', '12.19.0', 'NoSQL real-time document persistence', 'src/firebase.ts, firestore.rules'],
    ['@google/genai', '2.4.0', 'Official Gemini SDK for AI review synthesis', 'server.ts API proxy routes'],
    ['QRCode', '1.5.4', 'Vector SVG QR code generation for mobile handoff', 'src/components/ProductDetailModal.tsx'],
    ['Lucide React', '0.546.0', 'Lightweight technical and shopping iconography', 'Throughout all UI components']
  ]},
  { type: 'paragraph', text: 'No external deprecated libraries were utilized; all dependencies were installed via install_applet_package and verified with package.json.' }
]);

// PAGE 12: Development Environment
addGenericTextPage('2.3 Development Environment & AI Studio', 'Chapter 2: Requirements & Tech', [
  { type: 'paragraph', text: 'The development environment was hosted within Google AI Studio, combining real-time LLM prompting with an automated containerized Linux shell, Vite dev server, and Google Cloud Run deployment pipeline.' },
  { type: 'screenshot', height: 160, label: 'Google AI Studio Development Environment', caption: 'Figure 2.1: Google AI Studio Engineering & Verification Workspace', description: 'The workspace combines the conversation interface, file tree explorer, TypeScript compilation logs, and side-by-side live web preview.' },
  { type: 'paragraph', text: 'Key Developer Practices Followed:' },
  { type: 'bullets', items: [
    'Prompt Refinement: Specifying unambiguous architectural bounds before requesting code generation.',
    'Pristine Code Blocks: Creating complete, fully functioning modules without empty placeholders.',
    'Type Verification: Executing npm run lint (tsc --noEmit) after each edit cycle to catch type mismatches.',
    'Hot Reloading: Managing background dev server processes using restart_dev_server to verify live endpoints.'
  ]}
]);

// PAGE 13: System Architecture
addGenericTextPage('3.1 High-Level System Architecture', 'Chapter 3: System Design', [
  { type: 'paragraph', text: 'PrimeKart uses a three-tier architecture with a client-side Single Page Application (SPA), a server-authoritative application proxy, and cloud-managed identity and persistence services.' },
  { type: 'diagram', height: 170, content: `                      +---------------------------------------+
                      |         Client Browser Layer          |
                      | (React 19 + Tailwind + Lucide Icons)  |
                      +---------------------------------------+
                                  |                 |
          REST Endpoints / JSON   |                 | Firebase SDK
                                  v                 v
             +--------------------------+     +--------------------------+
             | Node.js / Express Server |     |  Google Firebase Cloud   |
             |  - Telemetry State Store |     |  - Google Authentication |
             |  - Explainable AI Engine |     |  - Cloud Firestore DB    |
             |  - Gemini API Proxy      |     |  - firestore.rules (RBAC)|
             +--------------------------+     +--------------------------+
                          |
                          v
             +--------------------------+
             |   Google Gemini Cloud    |
             |  (gemini-3.8-flash SDK)  |
             +--------------------------+` },
  { type: 'paragraph', text: 'The boundary ensures that sensitive API keys (GEMINI_API_KEY) and administrative risk telemetry remain on the server and are never exposed in browser network traffic.' }
]);

// PAGE 14: User Flow
addGenericTextPage('3.2 Comprehensive User Flow', 'Chapter 3: System Design', [
  { type: 'paragraph', text: 'The customer journey is designed to be frictionless under normal conditions, while dynamically interjecting security challenges when suspicious behavior is detected.' },
  { type: 'screenshot', height: 160, label: 'User Flow / Multiple Screens Composite', caption: 'Figure 3.1: Multi-Screen Progression: Catalog -> Product -> Cart -> Checkout', description: 'Composite visual showing the seamless transition from product discovery to slide-out checkout and order placement.' },
  { type: 'bullets', items: [
    'Discovery: Shoppers browse the catalog, use voice search, or filter by category pills.',
    'Product Inspection: Users open the ProductDetailModal to review technical specifications, eco scores, and trade-in options.',
    'Mobile QR Handoff: Shoppers on desktop can generate a QR code to transfer the session directly to their mobile browser.',
    'Checkout & Evaluation: Placing an order invokes the server-authoritative risk evaluation before payment clearing.'
  ]}
]);

// PAGE 15: Database Design
addGenericTextPage('3.3 Cloud Firestore Data Model', 'Chapter 3: System Design', [
  { type: 'paragraph', text: 'Data persistence is organized in Google Cloud Firestore using a normalized document structure governed by strict zero-trust security rules.' },
  { type: 'diagram', height: 140, content: `/databases/(default)/documents
  |
  +-- /users/{userId}               (Public profile: displayName, role, photoURL)
  |     |
  |     +-- /private/sensitiveData  (Vaulted PII: addresses, phone, spend limits)
  |
  +-- /products/{productId}         (Catalog items: title, price, category, stock)
  |     |
  |     +-- /reviews/{reviewId}     (Verified customer reviews, ratings, comments)
  |
  +-- /orders/{orderId}             (Order items, totals, delivery status, userRef)
  |
  +-- /coupons/{couponCode}         (Active promo codes, discounts, validity)` },
  { type: 'paragraph', text: 'Access Rules Highlights (firestore.rules):' },
  { type: 'bullets', items: [
    'User Profiles: Users can only write to their own /users/{userId} document.',
    'PII Vaulting: /users/{userId}/private is completely unreadable to other users and third-party callers.',
    'Order Protection: Customers can only query orders matching request.auth.uid == userId. Unrestricted listing is blocked.'
  ]}
]);

// PAGE 16: Home Page
addGenericTextPage('4.1 Home Page & Storefront Header', 'Chapter 4: Storefront Implementation', [
  { type: 'paragraph', text: 'The PrimeKart storefront interface emphasizes Swiss neo-grotesque design principles, utilizing Plus Jakarta Sans for structural headings and Inter for user interface elements.' },
  { type: 'screenshot', height: 170, label: 'Main Storefront Landing View', caption: 'Figure 4.1: Storefront Landing Interface with Minimalist Navigation', description: 'The landing view shows the top announcement bar with exchange rates, the multimodal search bar, category navigation pills, and the curated hero showcase.' },
  { type: 'paragraph', text: 'Navigation Features Implemented in src/App.tsx:' },
  { type: 'bullets', items: [
    'Real-Time Currency Switcher: Instant conversion across USD, INR, EUR, and GBP with tabular numerical alignment.',
    'Multimodal Search Bar: Accepts text queries, speech-to-text voice recognition, and image uploads for visual discovery.',
    'Department Quick-Filters: One-click pills filtering the catalog to Audio, Architectural, Botanical, or Horology items.'
  ]}
]);

// PAGE 17: Product Listing
addGenericTextPage('4.2 Product Listing & Category Grid', 'Chapter 4: Storefront Implementation', [
  { type: 'paragraph', text: 'The catalog grid displays available products with genuine studio imagery, formatted price badges, star ratings, and real-time inventory levels.' },
  { type: 'screenshot', height: 170, label: 'Dynamic Catalog Grid View', caption: 'Figure 4.2: Dynamic Product Catalog Grid with Responsive Cards', description: 'Each card displays genuine studio photography, category tags, price in active currency, verified rating, and quick-action buttons.' },
  { type: 'paragraph', text: 'Card Component Features (src/data/catalog.ts & src/App.tsx):' },
  { type: 'bullets', items: [
    'Resilient Image Component: Automatically handles image load errors with graceful SVG fallbacks.',
    'Dynamic Discount Badges: Highlights percentage savings when original price exceeds current selling price.',
    'Interactive Wishlist & Compare: One-touch icons that add items to comparative memory states without reloading.'
  ]}
]);

// PAGE 18: Product Details & Mobile QR
addGenericTextPage('4.3 Product Detail Modal & Mobile QR', 'Chapter 4: Storefront Implementation', [
  { type: 'paragraph', text: 'The ProductDetailModal is a two-column module featuring high-resolution product showcases, technical specification tables, eco-scores, trade-in exchange options, and cross-device mobile handoff.' },
  { type: 'screenshot', height: 160, label: 'Product Detail Modal with Mobile QR Button', caption: 'Figure 4.3: Product Detail Modal with Mobile QR Code Generator', description: 'The modal displays product attributes, the trade-in toggle, and prominent Open on Phone (QR) buttons in both the header bar and secondary utility row.' },
  { type: 'paragraph', text: 'Mobile QR Code Generation Architecture:' },
  { type: 'bullets', items: [
    'Vector SVG Rendering: Uses the qrcode library to generate crisp, resolution-independent SVG QR codes.',
    'Deep-Link Parameter: Encodes the direct URL (?product=<id>) so scanning with a phone camera opens the exact item.',
    'Device Utilities: Includes 1-click Copy Link with visual toast feedback, native navigator.share, and SVG download.'
  ]}
]);

// PAGE 19: User Registration & Login
addGenericTextPage('4.4 Authentication & Role Management', 'Chapter 4: Storefront Implementation', [
  { type: 'paragraph', text: 'User identity is managed via Google Firebase Authentication. Upon first sign-in, the user profile is provisioned in Cloud Firestore with default privileges.' },
  { type: 'screenshot', height: 170, label: 'Authentication & Role Switcher', caption: 'Figure 4.4: Google OAuth Sign-In and Role-Based Account Menu', description: 'Screenshot of the Google authentication popup and the top-right account dropdown showing the active role badge (Customer, Seller, or Admin).' },
  { type: 'paragraph', text: 'Role Management Highlights (src/App.tsx):' },
  { type: 'bullets', items: [
    'Interactive Role Switcher: For academic and evaluation purposes, users can toggle between Customer, Seller, and Admin.',
    'Dynamic Tab Gating: Switching to Customer immediately removes the Security Center and Seller Hub tabs.',
    'State Synchronization: User role updates are written to Firestore (/users/{uid}) and cached in local memory.'
  ]}
]);

// PAGE 20: Shopping Cart
addGenericTextPage('4.5 Persistent Cart & Coupon Engine', 'Chapter 4: Storefront Implementation', [
  { type: 'paragraph', text: 'The shopping cart is implemented as a slide-out drawer accessible from any view. Cart contents are persisted to browser localStorage under aetheria_cart to survive page refreshes.' },
  { type: 'screenshot', height: 170, label: 'Slide-Out Shopping Cart Drawer', caption: 'Figure 4.5: Slide-Out Shopping Cart Drawer with Live Calculations', description: 'The drawer shows added items, quantity stepper controls, promo code input field, subtotal, and the Proceed to Checkout action.' },
  { type: 'paragraph', text: 'Cart Drawer Features (src/components/CartCheckoutDrawer.tsx):' },
  { type: 'bullets', items: [
    'Quantity Steppers: Allows customers to increment or decrement units with boundary checking (minimum 1 unit).',
    'Promotional Coupon Engine: Validates codes such as AETHERIA15 (15% off) and ECOCARBON10 ($40 eco credit).',
    'Dynamic Tax & Shipping: Real-time recalculation of taxes, delivery fees, and trade-in credits.'
  ]}
]);

// PAGE 21: Checkout & Order Process
addGenericTextPage('4.6 Multi-Option Checkout & Orders View', 'Chapter 4: Storefront Implementation', [
  { type: 'paragraph', text: 'The checkout view handles delivery address collection, payment method selection, security screening, and order submission.' },
  { type: 'screenshot', height: 160, label: 'Multi-Option Checkout Interface', caption: 'Figure 4.6: Multi-Option Checkout Interface with UPI QR, Card & COD', description: 'The checkout view displays shipping address fields, dynamic UPI QR payment generator, card inputs, and the final order placement button.' },
  { type: 'paragraph', text: 'Checkout Features & Security Checks:' },
  { type: 'bullets', items: [
    'Dynamic UPI QR Payment: Renders an instant UPI scan-and-pay QR code with transaction UTR verification.',
    'Credit/Debit Card Entry: Client-side Luhn algorithm and CVV format screening.',
    'Order Tracking Tab: Successful orders write directly to /orders/{orderId} and open the live delivery tracking timeline.'
  ]}
]);

// PAGE 22: Security Overview
addGenericTextPage('5.1 Zero-Trust Architecture & Pipeline', 'Chapter 5: Security & Fraud Detection', [
  { type: 'paragraph', text: 'Unlike standard retail platforms that rely on blind client trust, PrimeKart incorporates a server-authoritative Zero-Trust Cybersecurity Architecture where all transactions are evaluated on the backend before order completion.' },
  { type: 'diagram', height: 160, content: `                      [ Customer Clicks "Place Order" ]
                                     |
                                     v
                  [ Client Bundles Session Telemetry ]
                   - Request rate (req/min)
                   - Failed payment retries
                   - Rapid cart bursts & device ID
                                     |
                                     v
                 [ POST /api/security/evaluate-transaction ]
                                     |
                                     v
                [ Server Explainable AI Risk Scoring Engine ]
                                     |
             +-----------------------+-----------------------+
             |                       |                       |
             v (<30 Risk)            v (31-70 Risk)          v (>70 Risk)
       [LOW RISK]              [MEDIUM RISK]           [HIGH RISK]
      Order Cleared           Step-Up OTP Check       Transaction Blocked
     Instantly in DB          Required in Modal       & Logged in SOC` },
  { type: 'paragraph', text: 'This pipeline protects against card cracking, automated bot hoarding, and accidental overspending on shared devices.' }
]);

// PAGE 23: Explainable AI Risk Engine
addGenericTextPage('5.2 Explainable AI Risk Engine (0-100)', 'Chapter 5: Security & Fraud Detection', [
  { type: 'paragraph', text: 'The security core computes a transparent, explainable risk score ranging from 0 (Completely Safe) to 100 (Critical Threat), itemizing exact point contributions.' },
  { type: 'screenshot', height: 160, label: 'AI Risk Intercept Modal', caption: 'Figure 5.1: Explainable AI Risk Score Breakdown Modal', description: 'The SecurityCheckoutModal displays the calculated risk score (e.g., 88/100 HIGH RISK), itemized contributing risk factors, and actionable resolution steps.' },
  { type: 'paragraph', text: 'Risk Score Mathematical Formulation (server.ts):' },
  { type: 'bullets', items: [
    'Bot Velocity Points (up to 38 pts): Assigned when client request velocity exceeds 300 requests/minute.',
    'Payment Retries (up to 45 pts): Assigned when multiple payment failures or instrument cycling is detected.',
    'Device Anomalies (up to 20 pts): Triggered when unknown device fingerprints or multiple accounts share hardware.',
    'Order Spikes (up to 15 pts): Assigned when an order significantly exceeds average historical transaction values.'
  ]}
]);

// PAGE 24: Payment Attack Detection
addGenericTextPage('5.3 Payment Attack & Card Cycling Defense', 'Chapter 5: Security & Fraud Detection', [
  { type: 'paragraph', text: 'Card-testing bots cycle stolen credit card numbers rapidly across retail checkout forms until a charge succeeds. PrimeKart actively detects and blocks this behavior.' },
  { type: 'screenshot', height: 160, label: 'Payment Attack Detection in Checkout', caption: 'Figure 5.2: Payment Credential Attack Intercept in Checkout Drawer', description: 'Screenshot showing the payment security block triggered after 6 failed payment attempts across 4 instruments.' },
  { type: 'paragraph', text: 'Detection and Mitigation Logic Implemented in server.ts:' },
  { type: 'bullets', items: [
    'Sliding Window Counter: Tracks sequential payment failures within a 5-minute rolling window.',
    'Instrument Diversity Tracking: Flags sessions attempting more than 2 distinct payment methods within seconds.',
    'Automated Token Lockout: Locks the payment gateway token, marks the transaction THREAT_CONTAINED, and alerts the SOC.'
  ]}
]);

// PAGE 25: Bot Detection
addGenericTextPage('5.4 Automated Bot & Scalping Detection', 'Chapter 5: Security & Fraud Detection', [
  { type: 'paragraph', text: 'Automated scrapers and scalping bots flood high-demand product drops to deplete merchant stock before human customers can purchase. PrimeKart inspects behavioral telemetry to neutralize automated abuse.' },
  { type: 'screenshot', height: 160, label: 'Bot Detection Incident in SOC', caption: 'Figure 5.3: Automated Scalping Bot Telemetry in Security Operations Center', description: 'The SOC log displays the contained bot attack incident, citing 812 requests/min and 23 automated checkout bursts.' },
  { type: 'paragraph', text: 'Telemetry Signals Monitored by the Server:' },
  { type: 'bullets', items: [
    'Request Frequency: Human users average 12–25 req/min. Scrapers exceeding 80 req/min trigger warnings, while >300 req/min triggers a bot block.',
    'SKU Polling Velocity: Repeated GET requests to a single product ID within milliseconds are flagged.',
    'Cart Burst Cadence: Adding items to cart in under 500ms without pointer events flags automated script execution.'
  ]}
]);

// PAGE 26: Parental Protection
addGenericTextPage('5.5 Parental Guardian Spend Limits', 'Chapter 5: Security & Fraud Detection', [
  { type: 'paragraph', text: 'To prevent unauthorized purchases by minors on shared family computers or tablets, PrimeKart features a Parental Guardian Protection module.' },
  { type: 'screenshot', height: 160, label: 'Parental Approval Intercept Dialog', caption: 'Figure 5.4: Parental Authorization Intercept Dialog in Checkout', description: 'Screenshot showing checkout suspended for an order exceeding the configured ₹2,000 spend limit, requiring parent biometric approval.' },
  { type: 'paragraph', text: 'Parental Control Mechanics:' },
  { type: 'bullets', items: [
    'Child Account Tagging: Accounts marked as isChildAccount are subject to configurable maximum spend limits (e.g., ₹2,000).',
    'Category Restrictions: High-value categories (Precision Horology) are blocked without parent verification.',
    'Biometric Assertion (Prototype / Demo): Parents approve the purchase using a WebAuthn / platform authenticator assertion demo generating a challenge hash.'
  ]}
]);

// PAGE 27: Prompt Injection & Data Isolation
addGenericTextPage('5.6 Prompt Injection & PII Isolation', 'Chapter 5: Security & Fraud Detection', [
  { type: 'paragraph', text: 'Integrating conversational AI into commercial platforms introduces vulnerabilities including prompt injection and accidental leakage of private customer data. PrimeKart mitigates this through architectural isolation.' },
  { type: 'screenshot', height: 160, label: 'AI Concierge Secure Response', caption: 'Figure 5.5: Isolated AI Concierge Answering Catalog Queries Securely', description: 'The AI Concierge answers catalog inquiries while rejecting prompt injection attempts seeking other customers orders.' },
  { type: 'paragraph', text: 'Security Defense Layers:' },
  { type: 'bullets', items: [
    'System Instruction Constraints: Gemini client system prompts prohibit disclosure of internal database schemas, server secrets, or rival catalog data.',
    'PII Vaulting: Customer shipping addresses and phone numbers reside exclusively in /users/{uid}/private/sensitiveData, invisible to the AI.',
    'Zero-Trust Rules: Client cannot issue arbitrary queries across the global orders collection.'
  ]}
]);

// PAGE 28: RBAC & SOC Protection
addGenericTextPage('5.7 Role-Based Access Control (RBAC)', 'Chapter 5: Security & Fraud Detection', [
  { type: 'paragraph', text: 'Access control ensures that administrative security telemetry and simulation tools remain invisible and inaccessible to standard shoppers and sellers.' },
  { type: 'screenshot', height: 150, label: 'Role Switcher and Account Menu', caption: 'Figure 5.6: Account Role Menu and Enforced Navigation Gating', description: 'The Account dropdown allows testing Customer, Seller, and Admin roles, demonstrating immediate hiding of the SOC for non-admin roles.' },
  { type: 'table', headers: ['Feature / Resource', 'Customer', 'Seller', 'Admin'], widths: [180, 100, 100, 110], rows: [
    ['Product Catalog & Purchasing', 'Allowed', 'Allowed', 'Allowed'],
    ['Customer Review Publication', 'Allowed', 'Allowed', 'Allowed'],
    ['Cross-Device QR Generation', 'Allowed', 'Allowed', 'Allowed'],
    ['Seller Inventory Management', 'Denied (Hidden)', 'Allowed', 'Allowed'],
    ['Security Operations Center (SOC)', 'Denied (Hidden)', 'Denied (Hidden)', 'Allowed'],
    ['Live Telemetry & Attack Testing', 'Denied (Hidden)', 'Denied (Hidden)', 'Allowed']
  ]}
]);

// PAGE 29: Gemini AI Integration
addGenericTextPage('6.1 Practical Gemini 3.8 Flash Implementation', 'Chapter 6: Artificial Intelligence', [
  { type: 'paragraph', text: 'Google Gemini 3.8 Flash was integrated via the official @google/genai SDK to deliver practical e-commerce utilities rather than novelty chat widgets.' },
  { type: 'screenshot', height: 160, label: 'AI Customer Review Synthesis Card', caption: 'Figure 6.1: AI Customer Review Synthesis Card in Product Details', description: 'Screenshot of the ProductDetailModal showing the AI Synthesis panel highlighting verified customer pros, cons, and buying recommendations.' },
  { type: 'paragraph', text: 'Key Practical AI Capabilities:' },
  { type: 'bullets', items: [
    'Review Sentiment Synthesis: Summarizes dozens of customer ratings into concise bullet points, pros, cons, and a definitive verdict.',
    'Multimodal Visual Search: Accepts uploaded images of furniture or audio gear and identifies matching catalog products.',
    'Risk Telemetry Explanation: Generates human-readable explanations of complex security alerts for SOC operators.'
  ]}
]);

// PAGE 30: AI Prompt & Schema Workflow
addGenericTextPage('6.2 Prompt Engineering & Structured Schemas', 'Chapter 6: Artificial Intelligence', [
  { type: 'paragraph', text: 'To guarantee predictable rendering on the React frontend, all Gemini API calls are configured with strict structured JSON schemas (responseSchema) using @google/genai Type constants.' },
  { type: 'screenshot', height: 150, label: 'Structured JSON Schema in server.ts', caption: 'Figure 6.2: Structured JSON Output Implementation in Express Server', description: 'Code screenshot from server.ts illustrating the Type.OBJECT schema enforcement for the AI review synthesizer endpoint.' },
  { type: 'paragraph', text: 'Server Implementation Pattern (server.ts):' },
  { type: 'diagram', height: 95, content: `const response = await ai.models.generateContent({
  model: 'gemini-3.8-flash',
  contents: promptPayload,
  config: {
    responseMimeType: 'application/json',
    responseSchema: {
      type: Type.OBJECT,
      properties: {
        summary: { type: Type.STRING },
        pros: { type: Type.ARRAY, items: { type: Type.STRING } },
        cons: { type: Type.ARRAY, items: { type: Type.STRING } },
        verdict: { type: Type.STRING },
      },
      required: ['summary', 'pros', 'cons', 'verdict'],
    },
  },
});` }
]);

// PAGE 31: Functional Testing
addGenericTextPage('7.1 Functional Test Cases & Matrix', 'Chapter 7: System Testing', [
  { type: 'paragraph', text: 'Functional testing validated every phase of the customer shopping cycle to confirm that data persistence, pricing, and UI state transition accurately.' },
  { type: 'table', headers: ['Test ID', 'Scenario', 'Input Steps', 'Expected Outcome', 'Status'], widths: [50, 95, 140, 160, 45], rows: [
    ['TC-F01', 'Google Login', 'Click Google Login popup', 'Authenticates; creates profile', 'PASS'],
    ['TC-F02', 'Category Filter', 'Select Audio & Acoustics', 'Filters catalog to 2 audio items', 'PASS'],
    ['TC-F03', 'Currency Switch', 'Change USD to INR', 'Recalculates all prices in INR (₹)', 'PASS'],
    ['TC-F04', 'QR Code Gen', 'Click Generate QR Code', 'Renders crisp vector SVG QR', 'PASS'],
    ['TC-F05', 'Mobile Deep-Link', 'Open ?product=prod_01', 'Auto-launches product modal', 'PASS'],
    ['TC-F06', 'Promo Code', 'Enter code AETHERIA15', 'Applies 15% discount to subtotal', 'PASS'],
    ['TC-F07', 'Place Order', 'Fill shipping & pick COD', 'Saves order document in Firestore', 'PASS']
  ]},
  { type: 'paragraph', text: 'All 7 functional scenarios completed with 100% pass rates across test cycles.' }
]);

// PAGE 32: Security Testing
addGenericTextPage('7.2 Security Verification & Threat Tests', 'Chapter 7: System Testing', [
  { type: 'paragraph', text: 'Security test cases verified that suspicious order patterns trigger immediate mitigation instead of allowing fraudulent transactions.' },
  { type: 'table', headers: ['Test ID', 'Attack Scenario', 'Simulated Input', 'Mitigation Triggered', 'Status'], widths: [50, 100, 135, 160, 45], rows: [
    ['TC-S01', 'Bot Velocity', '812 requests/minute', 'Score 94; checkout blocked', 'PASS'],
    ['TC-S02', 'Card Cycling', '6 failed payment retries', 'Token locked; payment blocked', 'PASS'],
    ['TC-S03', 'Child Spend Limit', '₹4,500 on ₹2,000 ceiling', 'Suspends for parent approval', 'PASS'],
    ['TC-S04', 'RBAC Breach Attempt', 'Customer role visits SOC', 'Tab omitted from navigation', 'PASS'],
    ['TC-S05', 'Illegal Data Query', 'Query other users orders', 'Firestore rules permission denied', 'PASS']
  ]},
  { type: 'screenshot', height: 140, label: 'Security Center Incident Log', caption: 'Figure 7.1: Security Operations Center Incident Mitigation Log', description: 'Screenshot of the SOC showing contained bot and payment attacks with automated mitigation timelines.' }
]);

// PAGE 33: Responsive UI Testing
addGenericTextPage('7.3 Cross-Device Responsive Testing', 'Chapter 7: System Testing', [
  { type: 'paragraph', text: 'Responsive testing confirmed layout integrity across mobile handsets (375px), tablets (768px), and wide desktop displays (1440px).' },
  { type: 'screenshot', height: 160, label: 'Mobile & Tablet Responsive Layouts', caption: 'Figure 7.2: Cross-Device Responsiveness (Mobile 375px & Tablet 768px)', description: 'Screenshot showing the single-column mobile view with bottom navigation and the two-column tablet catalog view.' },
  { type: 'paragraph', text: 'Verified Viewport Dimensions:' },
  { type: 'bullets', items: [
    'Mobile Handsets (375px - 640px): Stacked single-column product feed, full-width cart drawer, touch-friendly QR modal.',
    'Tablet Devices (641px - 1024px): 2-column catalog grid, compact header navigation, horizontal scrollable filter pills.',
    'Desktop Displays (1025px+): 3-column catalog grid, persistent dual-column product modal showcase, side-by-side SOC.'
  ]}
]);

// PAGE 34: Issue Resolution Log
addGenericTextPage('7.4 Defect Tracking & Resolution Log', 'Chapter 7: System Testing', [
  { type: 'paragraph', text: 'During testing, concrete software defects were discovered, triaged, and resolved:' },
  { type: 'table', headers: ['Bug ID', 'Subsystem', 'Defect Root Cause', 'Engineering Fix Implemented', 'Status'], widths: [50, 75, 140, 180, 45], rows: [
    ['BUG-01', 'Firestore', 'Admin order list query failed', 'Added admin emails to isBootstrappedAdmin in rules', 'FIXED'],
    ['BUG-02', 'Gemini AI', '404 on deprecated gemini-2.5', 'Upgraded server model calls to gemini-3.8-flash', 'FIXED'],
    ['BUG-03', 'Images', 'Travertine lamp showed hero room', 'Generated studio photo; mapped in catalog.ts', 'FIXED'],
    ['BUG-04', 'Security', 'SOC visible to customer/seller', 'Gated tab strictly to userRole === admin', 'FIXED'],
    ['BUG-05', 'Handoff', 'Desktop users unable to phone', 'Integrated qrcode library & ?product= deep-link', 'FIXED']
  ]},
  { type: 'paragraph', text: 'All recorded bugs were verified resolved in the final build with zero regressions.' }
]);

// PAGE 35: Technical Challenges
addGenericTextPage('8.1 Technical Challenges Encountered', 'Chapter 8: Development Experience', [
  { type: 'paragraph', text: 'Engineering an e-commerce platform with embedded security and AI capabilities surfaced three main technical hurdles:' },
  { type: 'heading', text: 'Challenge 1: Firestore & Local State Inconsistencies' },
  { type: 'paragraph', text: 'When hydrating products from Cloud Firestore, stale local database records occasionally overwrote newly generated studio photography paths, causing broken room photos to render.' },
  { type: 'heading', text: 'Challenge 2: Preventing Security Privilege Leakage' },
  { type: 'paragraph', text: 'Early iterations of the security intercept modal included an Inspect in SOC button. Non-admin customers could see this action, violating role boundary isolation.' },
  { type: 'heading', text: 'Challenge 3: Frictionless Desktop-to-Mobile Handoff' },
  { type: 'paragraph', text: 'Enabling shoppers browsing on desktop computers to complete checkout on mobile UPI apps without complex account pairing protocols.' }
]);

// PAGE 36: Solutions Implemented
addGenericTextPage('8.2 Architectural Solutions Implemented', 'Chapter 8: Development Experience', [
  { type: 'paragraph', text: 'Focused engineering solutions were implemented to resolve each technical challenge:' },
  { type: 'heading', text: 'Solution 1: Canonical Asset Reconciliation' },
  { type: 'paragraph', text: 'Created a resolveGenuineProductImage helper in catalog.ts that normalizes hydrated Firestore documents against verified studio photography paths, preventing stale overrides.' },
  { type: 'heading', text: 'Solution 2: Strict isAdmin Prop Gating' },
  { type: 'paragraph', text: 'Updated SecurityCheckoutModal.tsx and CartCheckoutDrawer.tsx to receive an explicit isAdmin={userProfile?.role === "admin"} prop, omitting administrative links for regular users.' },
  { type: 'heading', text: 'Solution 3: Vector SVG QR Code Deep-Linking' },
  { type: 'paragraph', text: 'Integrated the qrcode library to generate vector SVG codes encoding window.location URLs. Added a URL listener in App.tsx to auto-launch the matching product modal upon mobile scan.' }
]);

// PAGE 37: Final Website Showcase
addGenericTextPage('8.3 Final System Visual Showcase', 'Chapter 8: Development Experience', [
  { type: 'paragraph', text: 'The completed PrimeKart web platform demonstrates a harmonious integration of commercial usability and cybersecurity defense.' },
  { type: 'screenshot', height: 180, label: 'Comprehensive Application Showcase', caption: 'Figure 8.1: Full Multi-Panel Application Showcase', description: 'Composite showing: 1. Main Storefront Hero, 2. Product Detail Modal with Mobile QR, 3. Cart Checkout Drawer, 4. Security Operations Center, and 5. AI Review Synthesizer.' },
  { type: 'paragraph', text: 'The showcase highlights how zero-trust security and generative AI can be integrated without disrupting clean consumer aesthetics.' }
]);

// PAGE 38: Project Outcomes
addGenericTextPage('9.1 Project Outcomes & Achievements', 'Chapter 9: Results & Conclusion', [
  { type: 'paragraph', text: 'The internship project successfully satisfied all original technical, security, and user experience objectives:' },
  { type: 'bullets', items: [
    'Complete Commercial Storefront: Operational React 19 application supporting 4 luxury categories, multi-currency conversion, and persistent shopping carts.',
    'Cross-Device Mobile QR Handoff: Seamless on-demand SVG QR code generator with deep-linked URL synchronization (?product=<id>).',
    'Explainable Cybersecurity Engine: Server-authoritative 0-100 risk scoring evaluating bot velocity, payment retries, and device sharing.',
    'Zero-Trust Role Isolation: Security Operations Center and attack simulation tools strictly masked from Customer and Seller accounts.',
    'Practical Generative AI: Integration of Google Gemini 3.8 Flash via @google/genai for customer review synthesis and visual search.',
    'Production Code Quality: Clean static type-checking (tsc --noEmit) and verified bundle compilation.'
  ]},
  { type: 'paragraph', text: 'The platform serves as an end-to-end prototype for secure modern digital retail.' }
]);

// PAGE 39: Learning Outcomes & Future Work
addGenericTextPage('9.2 Learning Outcomes & Future Work', 'Chapter 9: Results & Conclusion', [
  { type: 'heading', text: 'Student Learning Outcomes:' },
  { type: 'bullets', items: [
    'Advanced React 19 Engineering: Mastered state management, performance optimization, and modular component hierarchy.',
    'Zero-Trust Web Security: Gained practical expertise in designing server-side risk heuristics and Firestore security rules.',
    'Cloud Database Management: Learned real-time document synchronization and role-based data partitioning in Cloud Firestore.',
    'AI SDK Integration: Implemented generative AI using official @google/genai TypeScript SDKs and structured JSON schemas.'
  ]},
  { type: 'heading', text: 'Planned Future Work (Future Enhancements):' },
  { type: 'bullets', items: [
    'Production Payment Gateways: Integrating production Razorpay and Stripe webhook handlers for live financial clearing.',
    'Hardware FIDO2 Biometrics: Upgrading simulated parent biometric assertions to hardware WebAuthn fingerprint/FaceID sensors.',
    'Edge CDN Asset Delivery: Caching catalog images across global Content Delivery Networks for sub-50ms international latency.'
  ]}
]);

// PAGE 40: Conclusion & References
addGenericTextPage('9.3 Conclusion & Technical References', 'Chapter 9: Results & Conclusion', [
  { type: 'paragraph', text: 'The development of PrimeKart (by Aetheria) during this internship provided invaluable hands-on experience in full-stack engineering, cloud architecture, and web application security. By combining an intuitive digital storefront with an explainable cybersecurity engine and cloud-backed identity management, the project successfully demonstrated how retail platforms can protect merchants and consumers while delivering an exceptional shopping experience.' },
  { type: 'heading', text: 'Technical References:' },
  { type: 'bullets', items: [
    'React Documentation: React 19 Component Architecture, Hooks & State Management. (https://react.dev)',
    'Google GenAI SDK: @google/genai TypeScript Reference and Gemini 3.8 Flash Model Guide. (https://ai.google.dev/gemini-api/docs)',
    'Google Firebase Documentation: Authentication and Cloud Firestore Security Rules Configuration. (https://firebase.google.com/docs/firestore)',
    'Tailwind CSS Guidelines: Modern Utility-First Typography and Fluid Layout Systems. (https://tailwindcss.com/docs)',
    'OWASP Foundation: Automated Threat Handbook for Web Applications & E-Commerce Security. (https://owasp.org)',
    'Express.js Documentation: Node.js Web Application Framework & Routing Middlewares. (https://expressjs.com)'
  ]},
  { type: 'paragraph', text: 'All technologies and frameworks cited in this report were verified directly from project source code.' }
]);

// =============================================================================
// RENDER ALL 40 PAGES
// =============================================================================

console.log(`Rendering ${pages.length} pages...`);

pages.forEach((pageFn, index) => {
  const pageNum = index + 1;
  doc.addPage();
  drawPageHeader(doc, pageNum);
  drawPageFooter(doc, pageNum, pages.length);
  pageFn(doc);
});

doc.end();

writeStream.on('finish', () => {
  console.log('SUCCESS: 40-Page PDF generated successfully at:', PDF_PATH);
  console.log('File size:', fs.statSync(PDF_PATH).size, 'bytes');
});

writeStream.on('error', (err) => {
  console.error('ERROR generating PDF:', err);
});
