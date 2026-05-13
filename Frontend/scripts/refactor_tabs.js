import fs from 'fs';

const filePath = 'c:/Users/Antonio/Desktop/Tempos/Frontend/src/pages/LandingPage.jsx';

// Let's reset the file to the tracked state first!
import { execSync } from 'child_process';
execSync('git checkout ' + filePath);

let content = fs.readFileSync(filePath, 'utf-8');

// 1. Remove intersection observer
content = content.replace(
/    const sections = navItems[\s\S]*?    return \(\) => observer\.disconnect\(\);\n  \}, \[\]\);\n/m,
''
);

// 2. Update scrollToSection
content = content.replace(
/  const scrollToSection = \(id\) => \{[\s\S]*?  \};\n/m,
`  const scrollToSection = (id) => {
    setActiveSection(id);
    window.scrollTo({ top: 0, behavior: 'instant' });
    setNavOpen(false);
  };
`
);

// 3. Update texts & badge
content = content.replace(
  /heroPrimary: 'Solicitar prueba 14 días',/,
  `heroPrimary: 'PRUEBA GRATIS LA HERRAMIENTA',`
);
content = content.replace(
  /<span className="tp-brand-proof">Cumplimiento laboral verificado<\/span>/,
  ''
);

content = content.replace(
  /<div className="tp-nav-actions hide-mob">[\s\S]*?<\/div>/,
  `<div className="tp-nav-actions-placeholder" />`
);
content = content.replace(
  /<div className="tp-nav-actions-mob show-mob">[\s\S]*?<\/div>/,
  `<div className="tp-nav-actions hide-mob">
          <Link to="/login" className="tp-btn tp-btn-primary" {...bindPrefetch('/login')}>ACCESO EMPRESA</Link>
        </div>`
);
content = content.replace(
  /<div className="tp-mob-nav-actions">[\s\S]*?<\/div>/,
  `<div className="tp-mob-nav-actions">
          <Link to="/login" className="tp-btn tp-btn-primary" onClick={() => setNavOpen(false)} {...bindPrefetch('/login')}>ACCESO EMPRESA</Link>
        </div>`
);


// 4. Move Feature Showcase
const startShowcase = content.indexOf('      {/* ── Feature Showcase ── */}');
const endShowcase = content.indexOf('      {/* ── Core modules ── */}');
const showcaseStr = content.substring(startShowcase, endShowcase);

content = content.replace(showcaseStr, '');

const startHowItWorks = content.indexOf('      {/* ── How it works ── */}');
content = content.slice(0, startHowItWorks) + showcaseStr + content.slice(startHowItWorks);


// 5. FIND INDEXES AFTER ALL PREVIOUS REPLACEMENTS!
const startHero = content.indexOf('      {/* ── Hero ── */}');
const startBenefits = content.indexOf('      {/* ── Benefits ── */}');
const startShowcaseNew = content.indexOf('      {/* ── Feature Showcase ── */}');
const startFaqs = content.indexOf('      {/* ── FAQs ── */}');
const startPricing = content.indexOf('      {/* ── Pricing ── */}');
const endPricingSection = content.indexOf('      </main>');

// Replace main tag - do this by index to avoid shifting the previously found indexes!
const mainOpenIndex = content.lastIndexOf('<main id="contenido-principal"', startHero);
const mainOpenEnd = content.indexOf('>', mainOpenIndex) + 1;

content = 
  content.slice(0, mainOpenIndex) +
  `<main id="contenido-principal" style={{ position: 'relative', overflow: 'hidden', minHeight: '100vh' }}>\n        <AnimatePresence mode="wait">` +
  `\n          {activeSection === 'inicio' && (\n            <motion.div key="inicio" initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -15 }} transition={{ duration: 0.25 }}>\n` +
  content.slice(mainOpenEnd, startBenefits) +
  `            </motion.div>\n          )}\n\n          {activeSection === 'producto' && (\n            <motion.div key="producto" initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -15 }} transition={{ duration: 0.25 }}>\n` +
  content.slice(startBenefits, startShowcaseNew) +
  `            </motion.div>\n          )}\n\n          {activeSection === 'proceso' && (\n            <motion.div key="proceso" initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -15 }} transition={{ duration: 0.25 }}>\n` +
  content.slice(startShowcaseNew, startFaqs) +
  `            </motion.div>\n          )}\n\n          {activeSection === 'faqs' && (\n            <motion.div key="faqs" initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -15 }} transition={{ duration: 0.25 }}>\n` +
  content.slice(startFaqs, startPricing) +
  `            </motion.div>\n          )}\n\n          {activeSection === 'precios' && (\n            <motion.div key="precios" initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -15 }} transition={{ duration: 0.25 }}>\n` +
  content.slice(startPricing, endPricingSection) +
  `            </motion.div>\n          )}\n` +
  `        </AnimatePresence>\n      </main>` +
  content.slice(endPricingSection + 13); // +13 for '      </main>'

fs.writeFileSync(filePath, content, 'utf-8');
console.log("File refactored successfully.");
