$(document).ready(function () {
    let currentSlide = 0;
    const slides = $('.slider-image');

    function showSlide(index) {
        slides.removeClass('active').eq(index).addClass('active');
    }

    showSlide(currentSlide);

    $('.left-control').click(function () {
        currentSlide = (currentSlide - 1 + slides.length) % slides.length;
        showSlide(currentSlide);
    });

    $('.right-control').click(function () {
        currentSlide = (currentSlide + 1) % slides.length;
        showSlide(currentSlide);
    });
});

const downloadLink = document.querySelector('#download-btn');

if (downloadLink != null) {
    downloadLink.addEventListener('click', () => {
        downloadFile();
    });
}

async function downloadFile() {
    const filename = downloadLink.download;
    const url = downloadLink.href;
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
}