  // Accordion: each item opens/closes independently with a slow slide and
  // stays open until the user closes it. Falls back to native instant toggle
  // when the user prefers reduced motion or WAAPI is unavailable.
  (function(){
    var accordion = document.querySelector('.accordion');
    if (!accordion) return;
    var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduce || !document.body.animate) return; // native behaviour, [open] styling

    accordion.classList.add('js-acc');

    var DUR_OPEN = 560, DUR_CLOSE = 460;
    var EASE_OPEN = 'cubic-bezier(.16,1,.3,1)';   // --ease-out-expo (dramatic slide)
    var EASE_CLOSE = 'cubic-bezier(.25,1,.5,1)';  // --ease-out-quart

    function Acc(el){
      this.el = el;
      this.summary = el.querySelector('summary');
      this.content = el.querySelector('.acc-body');
      this.heightAnim = null;
      this.contentAnim = null;
      this.closing = false;
      this.expanding = false;
      if (el.open) el.classList.add('is-open');
      this.summary.addEventListener('click', this.onClick.bind(this));
    }

    Acc.prototype.onClick = function(e){
      e.preventDefault();
      this.el.style.overflow = 'hidden';
      if (this.closing || !this.el.open) this.open();
      else if (this.expanding || this.el.open) this.shrink();
    };

    Acc.prototype.cancelAnims = function(){
      if (this.heightAnim) this.heightAnim.cancel();
      if (this.contentAnim) this.contentAnim.cancel();
    };

    Acc.prototype.open = function(){
      this.el.style.height = this.el.offsetHeight + 'px';
      this.el.open = true;
      this.el.classList.add('is-open');
      window.requestAnimationFrame(this.expand.bind(this));
    };

    Acc.prototype.expand = function(){
      this.expanding = true;
      this.closing = false;
      this.cancelAnims();
      var start = this.el.offsetHeight;
      // Absolute target (scrollHeight = full natural height while open) so an
      // interrupted shrink→expand can't overshoot. Relative math (start ± content)
      // computed a wrong target whenever the height was mid-animation.
      var end = this.el.scrollHeight;
      this.heightAnim = this.el.animate(
        {height:[start + 'px', end + 'px']},
        {duration:DUR_OPEN, easing:EASE_OPEN}
      );
      this.contentAnim = this.content.animate(
        {opacity:[0,1], transform:['translateY(12px)','translateY(0)']},
        {duration:DUR_OPEN, easing:EASE_OPEN}
      );
      this.heightAnim.onfinish = this.done.bind(this, true);
      this.heightAnim.oncancel = (function(){ this.expanding = false; }).bind(this);
    };

    Acc.prototype.shrink = function(){
      this.closing = true;
      this.expanding = false;
      this.el.classList.remove('is-open');
      this.cancelAnims();
      var start = this.el.offsetHeight;
      // Absolute collapsed target (full height minus the body) so an interrupted
      // expand→shrink can't under-shoot below the summary and clip it.
      var end = this.el.scrollHeight - this.content.offsetHeight;
      this.heightAnim = this.el.animate(
        {height:[start + 'px', end + 'px']},
        {duration:DUR_CLOSE, easing:EASE_CLOSE}
      );
      this.contentAnim = this.content.animate(
        {opacity:[1,0], transform:['translateY(0)','translateY(8px)']},
        {duration:DUR_CLOSE, easing:EASE_CLOSE}
      );
      this.heightAnim.onfinish = this.done.bind(this, false);
      this.heightAnim.oncancel = (function(){ this.closing = false; }).bind(this);
    };

    Acc.prototype.done = function(open){
      this.el.open = open;
      this.heightAnim = this.contentAnim = null;
      this.closing = this.expanding = false;
      this.el.style.height = '';
      this.el.style.overflow = '';
      if (open) this.el.classList.add('is-open');
      else this.el.classList.remove('is-open');
    };

    document.querySelectorAll('.accordion .acc-item').forEach(function(el){ new Acc(el); });
  })();

