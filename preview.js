/* preview.js — עוזר קטן לסרגל התצוגה בלבד.
   מגלגל את המחשבון הפעיל למרכז הסרגל, כדי שבמובייל לא יהיה חתוך.
   אפשר למחוק אותו יחד עם preview.css ועם ה-<div class="pv-bar">. */
document.addEventListener('DOMContentLoaded', function () {
  var nav = document.querySelector('.pv-nav');
  var active = nav && nav.querySelector('a.is-active');
  if (!nav || !active) return;
  if (nav.scrollWidth <= nav.clientWidth) return;
  var a = active.getBoundingClientRect(), n = nav.getBoundingClientRect();
  nav.scrollBy({ left: (a.left - n.left) - (n.width - a.width) / 2, behavior: 'auto' });
});
