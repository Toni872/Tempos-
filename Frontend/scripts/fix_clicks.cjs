const fs = require('fs');

const path = 'src/pages/LandingPage.jsx';
let content = fs.readFileSync(path, 'utf-8');

// Replace scrollToSection
const i1 = content.indexOf('  const scrollToSection = (id) => {');
const i2 = content.indexOf('  const navigateWithTransition = (path) => {');
if (i1 !== -1 && i2 !== -1) {
  content = content.slice(0, i1) +
    `  const scrollToSection = (id) => {
    setActiveSection(id);
    window.scrollTo({ top: 0, behavior: 'instant' });
    setNavOpen(false);
  };

` + content.slice(i2);
}

// Remove IntersectionObserver
const i3 = content.indexOf('  useEffect(() => {\n    const sections = navItems\n      .map((item)');
// CRLF support
const i3_crlf = content.indexOf('  useEffect(() => {\r\n    const sections = navItems\r\n      .map((item)');
const actual_i3 = i3 !== -1 ? i3 : i3_crlf;

const i4 = content.indexOf('  useEffect(() => {\n    const onScroll = () => {');
const i4_crlf = content.indexOf('  useEffect(() => {\r\n    const onScroll = () => {');
const actual_i4 = i4 !== -1 ? i4 : i4_crlf;

if (actual_i3 !== -1 && actual_i4 !== -1) {
  content = content.slice(0, actual_i3) + content.slice(actual_i4);
}

fs.writeFileSync(path, content, 'utf-8');
console.log('Fixed LandingPage.jsx');
