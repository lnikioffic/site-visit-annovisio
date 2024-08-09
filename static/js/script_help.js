document.querySelectorAll('.help .question-container').forEach(function (questionContainer) {
    questionContainer.addEventListener('click', function () {
        this.querySelector('.answer').classList.toggle('active');
        this.querySelector('.help-arrow').classList.toggle('close');
        if (this.querySelector('.help-arrow').classList.contains('close')) {
            this.querySelector('.help-arrow').style.backgroundImage = "url('static/images/arrowClose.png')";
        } else {
            this.querySelector('.help-arrow').style.backgroundImage = "url('static/images/arrowOpen.png')";
        }
    });
});