(function () {
      var theme = 'dark';
      try {
        if (localStorage.getItem('fv-theme') === 'light') theme = 'light';
      } catch (_) { /* Storage may be disabled. */ }
      var locale = 'sv';
      try {
        if (localStorage.getItem('fv-locale') === 'en') locale = 'en';
      } catch (_) { /* Storage may be disabled. */ }
      var root = document.documentElement;
      root.lang = locale;
      root.setAttribute('data-theme', theme);
      root.setAttribute('data-bs-theme', theme);
      root.style.colorScheme = theme;
    })();
