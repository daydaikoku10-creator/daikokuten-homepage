/* =========================================================
   デイサービス大黒天 JavaScript

   このファイルでは、次の動きをつけています。
     1. 写真がまだ無いとき「写真準備中」の画像を代わりに表示
     2. スマートフォンのメニューの開け閉め
     3. 「文字を大きくする」ボタン
     4. ボタンに合わせて、お問い合わせの種類を自動で選ぶ
     5. お問い合わせフォームの送信
     6. フッターの年（©2026 など）を自動で更新

   文章や写真を変えるだけなら、このファイルを編集する必要はありません。
   ========================================================= */


/* ---------------------------------------------------------
   1. 写真がまだ無いときの代わりの画像
      <img src="images/xxx.jpg" data-fallback="images/no-image.svg">
      のように書いておくと、xxx.jpg が無いときに no-image.svg を表示します。
      （写真の読み込みより先に準備したいので、ページの一番最初に動かしています）
   --------------------------------------------------------- */
document.addEventListener('error', function (event) {
  var img = event.target;
  if (img.tagName !== 'IMG' || !img.dataset.fallback) return;
  if (img.dataset.fallbackUsed) return; // 何度も繰り返さないように
  img.dataset.fallbackUsed = 'true';
  img.src = img.dataset.fallback;
}, true);

// 前回「文字を大きくする」を選んでいた場合は、表示の前に大きくしておく
var STORAGE_KEY = 'daikokuten-large-text';
try {
  if (localStorage.getItem(STORAGE_KEY) === '1') {
    document.documentElement.classList.add('is-large-text');
  }
} catch (e) { /* 何もしない */ }


document.addEventListener('DOMContentLoaded', function () {

  /* ---------------------------------------------------------
     2. スマートフォンのメニュー
     --------------------------------------------------------- */
  var menuButton = document.querySelector('.menu-button');
  var nav = document.getElementById('global-nav');

  function closeMenu() {
    nav.classList.remove('is-open');
    menuButton.setAttribute('aria-expanded', 'false');
    menuButton.querySelector('.menu-label').textContent = 'メニュー';
    document.body.classList.remove('is-menu-open');
  }

  function openMenu() {
    nav.classList.add('is-open');
    menuButton.setAttribute('aria-expanded', 'true');
    menuButton.querySelector('.menu-label').textContent = 'とじる';
    document.body.classList.add('is-menu-open');
  }

  if (menuButton && nav) {
    menuButton.addEventListener('click', function () {
      if (nav.classList.contains('is-open')) {
        closeMenu();
      } else {
        openMenu();
      }
    });

    // メニューの項目を押したら閉じる
    nav.querySelectorAll('a').forEach(function (link) {
      link.addEventListener('click', closeMenu);
    });

    // Escキーで閉じる
    document.addEventListener('keydown', function (event) {
      if (event.key === 'Escape' && nav.classList.contains('is-open')) {
        closeMenu();
        menuButton.focus();
      }
    });

    // 画面を広げてパソコン表示になったら閉じる
    window.matchMedia('(min-width: 1024px)').addEventListener('change', function (mq) {
      if (mq.matches) closeMenu();
    });
  }


  /* ---------------------------------------------------------
     3. 文字を大きくするボタン
        選んだ大きさはブラウザに記憶され、次に開いたときも同じ大きさになります。
     --------------------------------------------------------- */
  var fontButtons = document.querySelectorAll('.js-font-toggle');

  function setLargeText(isLarge) {
    document.documentElement.classList.toggle('is-large-text', isLarge);
    fontButtons.forEach(function (button) {
      button.setAttribute('aria-pressed', isLarge ? 'true' : 'false');
      button.textContent = isLarge ? '文字を標準にもどす' : '文字を大きくする';
    });
    try {
      localStorage.setItem(STORAGE_KEY, isLarge ? '1' : '0');
    } catch (e) {
      // 記憶できない設定のブラウザでも、表示はそのまま使えます
    }
  }

  // ボタンの文字を今の状態に合わせる
  if (document.documentElement.classList.contains('is-large-text')) setLargeText(true);

  fontButtons.forEach(function (button) {
    button.addEventListener('click', function () {
      setLargeText(!document.documentElement.classList.contains('is-large-text'));
    });
  });


  /* ---------------------------------------------------------
     4. お問い合わせの種類を自動で選ぶ
        data-inquiry="求人について" のように書いたボタンを押すと、
        フォームの「お問い合わせの種類」がその内容になります。
     --------------------------------------------------------- */
  var typeSelect = document.getElementById('f-type');

  document.querySelectorAll('.js-inquiry').forEach(function (button) {
    button.addEventListener('click', function () {
      var value = button.dataset.inquiry;
      if (!typeSelect || !value) return;
      var exists = Array.prototype.some.call(typeSelect.options, function (option) {
        return option.value === value;
      });
      if (exists) typeSelect.value = value;
    });
  });


  /* ---------------------------------------------------------
     5. お問い合わせフォームの送信
        form の action に送信先（Formspree など）のURLを入れると、ページ上で送信できます。
        URLに「XXXXXXXX」が残っている間は、data-mailto に書いたメールアドレス宛てに
        入力内容を書き込んだメールを作成します（利用者のメールアプリが開きます）。
     --------------------------------------------------------- */
  var form = document.getElementById('contact-form');
  var statusBox = document.getElementById('form-status');

  function showStatus(message, type) {
    statusBox.textContent = message;
    statusBox.className = 'form-status ' + (type === 'success' ? 'is-success' : 'is-error');
  }

  if (form && statusBox) {
    // 入力しなおしたら赤枠を消す
    form.addEventListener('input', function (event) {
      if (event.target.checkValidity && event.target.checkValidity()) {
        event.target.classList.remove('is-invalid');
      }
    });
    form.addEventListener('change', function (event) {
      if (event.target.checkValidity && event.target.checkValidity()) {
        event.target.classList.remove('is-invalid');
      }
    });

    form.addEventListener('submit', function (event) {
      event.preventDefault();

      // 入力もれのチェック
      var firstInvalid = null;
      form.querySelectorAll('input, select, textarea').forEach(function (field) {
        var ok = field.checkValidity();
        field.classList.toggle('is-invalid', !ok);
        if (!ok && !firstInvalid) firstInvalid = field;
      });
      if (firstInvalid) {
        showStatus('入力されていない項目があります。赤い枠の項目をご確認ください。', 'error');
        firstInvalid.focus();
        return;
      }

      var action = form.getAttribute('action') || '';
      if (action.indexOf('XXXXXXXX') !== -1) {
        var mailto = form.dataset.mailto;
        if (!mailto) {
          showStatus('ただいまフォームは準備中です。お手数ですが、お電話にてお問い合わせください。', 'error');
          return;
        }
        // 入力内容をメール本文にまとめて、メールアプリを開く
        var lines = [];
        new FormData(form).forEach(function (value, key) {
          lines.push('■' + key + '\n' + value + '\n');
        });
        var subject = '【ホームページからのお問い合わせ】' + (typeSelect ? typeSelect.value : '');
        window.location.href = 'mailto:' + mailto +
          '?subject=' + encodeURIComponent(subject) +
          '&body=' + encodeURIComponent(lines.join('\n'));
        showStatus('メールアプリが開きます。内容をご確認のうえ、送信してください。メールアプリが開かない場合は、お電話でお問い合わせください。', 'success');
        return;
      }

      var submitButton = form.querySelector('button[type="submit"]');
      submitButton.disabled = true;
      submitButton.textContent = '送信しています…';

      fetch(action, {
        method: 'POST',
        body: new FormData(form),
        headers: { Accept: 'application/json' }
      })
        .then(function (response) {
          if (!response.ok) throw new Error('送信エラー');
          form.reset();
          showStatus('お問い合わせありがとうございます。内容を確認のうえ、担当者よりご連絡いたします。', 'success');
        })
        .catch(function () {
          showStatus('送信できませんでした。時間をおいてもう一度お試しいただくか、お電話にてお問い合わせください。', 'error');
        })
        .then(function () {
          submitButton.disabled = false;
          submitButton.textContent = '送信する';
        });
    });
  }


  /* ---------------------------------------------------------
     6. フッターの年を自動更新
     --------------------------------------------------------- */
  var year = document.getElementById('year');
  if (year) year.textContent = new Date().getFullYear();
});
