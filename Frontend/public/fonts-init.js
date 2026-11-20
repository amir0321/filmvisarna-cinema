const fonts = document.getElementById('google-fonts');
if (fonts) {
  const activate = () => { fonts.media = 'all'; };
  if (fonts.sheet) activate();
  else fonts.addEventListener('load', activate, { once: true });
}
