document.addEventListener('DOMContentLoaded', function () {
    const videoAnnotationDiv = document.querySelector('.videoAnnotation');

    fetch('/get_markdown')
        .then(response => response.json())
        .then(data => {
            if (data.content) {
                const md = window.markdownit();
                const htmlContent = md.render(data.content);
                videoAnnotationDiv.innerHTML = htmlContent;

                // Add copy buttons to code blocks
                const codeBlocks = videoAnnotationDiv.querySelectorAll('pre');
                codeBlocks.forEach(block => {
                    const copyButton = document.createElement('button');
                    copyButton.classList.add('copy-button');
                    copyButton.textContent = 'Copy';
                    block.appendChild(copyButton);

                    copyButton.addEventListener('click', () => {
                        const code = block.querySelector('code').textContent;
                        navigator.clipboard.writeText(code).then(() => {
                            copyButton.textContent = 'Copied!';
                            setTimeout(() => {
                                copyButton.textContent = 'Copy';
                            }, 2000);
                        }).catch(err => {
                            console.error('Failed to copy: ', err);
                        });
                    });
                });
            } else {
                videoAnnotationDiv.innerHTML = '<p>Failed to load markdown file.</p>';
            }
        })
        .catch(error => {
            console.error('Error fetching the markdown file:', error);
            videoAnnotationDiv.innerHTML = '<p>Failed to load markdown file.</p>';
        });
});