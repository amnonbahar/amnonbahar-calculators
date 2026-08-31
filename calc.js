/* ============================================================
   מנוע המחשבונים של amnonbahar.co.il — נוסף 31.08.2026
   ------------------------------------------------------------
   קובץ משותף לכל עמודי /machshevonim/*. כל עמוד מגדיר רק את
   הנוסחה שלו; הקריאה מהשדות, העדכון החי של התוצאה, הפורמט
   העברי של המספרים והאיפוס — כולם כאן.
   כל החישוב מתבצע בדפדפן של המשתמש בלבד. שום נתון לא נשלח
   לשרת ולא נשמר בשום מקום (חשוב גם למדיניות הפרטיות של האתר).
   ============================================================ */
(function (global) {
  'use strict';

  var nf0 = new Intl.NumberFormat('he-IL', { maximumFractionDigits: 0 });
  var nf1 = new Intl.NumberFormat('he-IL', { minimumFractionDigits: 1, maximumFractionDigits: 1 });
  var nf2 = new Intl.NumberFormat('he-IL', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  function money(v) {
    if (!isFinite(v)) v = 0;
    return '₪' + nf0.format(Math.round(v));
  }
  function moneyShort(v) {
    if (!isFinite(v)) v = 0;
    var a = Math.abs(v);
    if (a >= 1000000) return '₪' + nf1.format(v / 1000000) + ' מ׳';
    return money(v);
  }
  function pct(v, d) {
    if (!isFinite(v)) v = 0;
    return (d === 2 ? nf2.format(v) : nf1.format(v)) + '%';
  }
  function years(v) {
    v = Math.round(v);
    if (v === 1) return 'שנה אחת';
    if (v === 2) return 'שנתיים';
    return nf0.format(v) + ' שנים';
  }
  function clamp(v, lo, hi) { return Math.min(hi, Math.max(lo, v)); }

  /* צבירה עתידית: הפקדה חודשית קבועה + יתרת פתיחה, בניכוי דמי ניהול.
     annualReturn / feeOnBalance / feeOnDeposit באחוזים (למשל 4 = 4%). */
  function accumulate(opts) {
    var months = Math.round((opts.years || 0) * 12);
    var bal = opts.initial || 0;
    var dep = opts.monthly || 0;
    var rNet = Math.pow(1 + (opts.annualReturn || 0) / 100, 1 / 12) - 1;
    var fBal = Math.pow(1 - (opts.feeOnBalance || 0) / 100, 1 / 12) - 1; // ניכוי חודשי שקול לשנתי
    var fDep = (opts.feeOnDeposit || 0) / 100;
    var deposits = 0, fees = 0;
    for (var i = 0; i < months; i++) {
      var net = dep * (1 - fDep);
      deposits += dep;
      fees += dep * fDep;
      bal += net;
      var growth = bal * rNet;
      bal += growth;
      var feeCut = bal * -fBal;
      fees += feeCut;
      bal -= feeCut;
      if (opts.growth) dep = dep * (1 + (opts.growth / 100) / 12);
    }
    return { balance: bal, deposits: deposits, fees: fees };
  }

  function readField(el) {
    if (el.type === 'radio') return el.checked ? el.value : null;
    if (el.type === 'checkbox') return el.checked;
    var v = el.value;
    if (el.dataset.type === 'text') return v;
    var n = parseFloat(String(v).replace(/[^0-9.\-]/g, ''));
    return isFinite(n) ? n : 0;
  }

  /* מחבר מחשבון: קורא כל [data-in], מריץ compute, וכותב לכל [data-out] */
  function init(rootSelector, compute) {
    var root = typeof rootSelector === 'string' ? document.querySelector(rootSelector) : rootSelector;
    if (!root) return;
    var inputs = Array.prototype.slice.call(root.querySelectorAll('[data-in]'));
    var defaults = inputs.map(function (el) {
      return el.type === 'radio' || el.type === 'checkbox' ? el.checked : el.value;
    });

    function read() {
      var o = {};
      inputs.forEach(function (el) {
        var k = el.dataset.in;
        var v = readField(el);
        if (v === null) return;
        o[k] = v;
      });
      return o;
    }

    function write(out) {
      Object.keys(out || {}).forEach(function (k) {
        var val = out[k];
        root.querySelectorAll('[data-out="' + k + '"]').forEach(function (n) {
          if (val && typeof val === 'object' && 'html' in val) n.innerHTML = val.html;
          else n.textContent = val;
        });
        root.querySelectorAll('[data-bar="' + k + '"]').forEach(function (n) {
          n.style.width = clamp(parseFloat(val) || 0, 0, 100) + '%';
        });
        root.querySelectorAll('[data-show="' + k + '"]').forEach(function (n) {
          n.hidden = !val;
        });
      });
    }

    function run() {
      try { write(compute(read()) || {}); }
      catch (e) { /* לא מפילים את העמוד בגלל קלט חריג */ }
    }

    inputs.forEach(function (el) {
      el.addEventListener('input', run);
      el.addEventListener('change', run);
    });

    root.querySelectorAll('[data-calc-reset]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        inputs.forEach(function (el, i) {
          if (el.type === 'radio' || el.type === 'checkbox') el.checked = defaults[i];
          else el.value = defaults[i];
        });
        run();
      });
    });

    run();
  }

  global.AB = {
    money: money, moneyShort: moneyShort, pct: pct, years: years,
    num: nf0.format, clamp: clamp, accumulate: accumulate, init: init
  };
})(window);
