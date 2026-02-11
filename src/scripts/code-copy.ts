const copyText = async (text: string): Promise<boolean> => {
    if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(text);
        return true;
    }

    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.setAttribute('readonly', '');
    textarea.style.position = 'absolute';
    textarea.style.left = '-9999px';
    textarea.style.top = '0';
    document.body.appendChild(textarea);
    textarea.select();

    try {
        return document.execCommand('copy');
    } catch {
        return false;
    } finally {
        document.body.removeChild(textarea);
    }
};

const copyIcon = `
  <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
    <rect x="9" y="9" width="10" height="10" rx="2"></rect>
    <path d="M5 15V7a2 2 0 0 1 2-2h8"></path>
  </svg>
`;
const checkIcon = `
  <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
    <path d="M5 13l4 4L19 7"></path>
  </svg>
`;
const failIcon = `
  <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
    <path d="M6 6l12 12M18 6L6 18"></path>
  </svg>
`;

const blocks = document.querySelectorAll('pre');
blocks.forEach((pre) => {
    const code = pre.querySelector('code');
    if (!code) return;

    let wrapper = pre.parentElement;
    if (!wrapper || !wrapper.classList.contains('code-block')) {
        wrapper = document.createElement('div');
        wrapper.className = 'code-block';
        pre.parentNode?.insertBefore(wrapper, pre);
        wrapper.appendChild(pre);
    }

    if (wrapper.querySelector('.code-copy-button')) return;

    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'code-copy-button';
    button.innerHTML = copyIcon;
    button.setAttribute('aria-label', 'Copy code to clipboard');
    button.setAttribute('title', 'Copy');

    const setState = (state: 'copied' | 'failed' | 'idle') => {
        if (state === 'copied') {
            button.innerHTML = checkIcon;
            button.dataset.copied = 'true';
            button.setAttribute('aria-label', 'Copied');
            button.setAttribute('title', 'Copied');
            return;
        }

        if (state === 'failed') {
            button.innerHTML = failIcon;
            button.dataset.copied = 'false';
            button.setAttribute('aria-label', 'Copy failed');
            button.setAttribute('title', 'Copy failed');
            return;
        }

        button.innerHTML = copyIcon;
        button.dataset.copied = 'false';
        button.setAttribute('aria-label', 'Copy code to clipboard');
        button.setAttribute('title', 'Copy');
    };

    let resetTimer: ReturnType<typeof setTimeout>;
    button.addEventListener('click', async () => {
        const text = code.textContent || '';
        const ok = await copyText(text);

        setState(ok ? 'copied' : 'failed');

        clearTimeout(resetTimer);
        resetTimer = setTimeout(() => setState('idle'), 2000);
    });

    wrapper.appendChild(button);
});
