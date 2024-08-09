// Переменная для видео
let video = document.getElementById('video');
// Контейнер для перетаскивания файлов
const dropArea = document.getElementById('drop-area');
// Холст для рисования
const canvas = document.getElementById('canvas');
// Кнопка для загрузки видео
const videoUploadButton = document.getElementById("video-upload-button");
// Кнопка для завершения аннотации
const finishAnnotationBtn = document.getElementById('finishAnnotation');
// Кнопка для отправки аннотации
const submitAnnotation = document.getElementById('submitAnnotation');
// Кнопка для начала аннотации
const startAnnotationBtn = document.getElementById('startAnnotation');
// Кнопка для добавления целей
const addTarget = document.getElementById('addTargets');
// Кнопка для отмены аннотации
const cancelAnnotationBtn = document.getElementById('cancelAnnotation');
// Кнопка для удаления аннотации
const deleteAnnotationBtn = document.getElementById('deleteAnnotation');
// Контекст для рисования на холсте
let ctx = canvas.getContext('2d', { willReadFrequently: true });
// Флаги для проверки состояния аннотации и рисования
let isAnnotating, isDrawing = false;
// Координаты начала и конца рисования
let startX, startY, endX, endY;
// Поле ввода для загрузки видео
const videoUploadInput = document.getElementById('video-upload');
// Форма для ввода названия класса
const annotationForm = document.getElementById('annotationForm');
// Поле ввода для названия класса
const classNameInput = document.getElementById('className');
// Модальное окно
const modal = document.getElementById('modal');
// Кнопка для закрытия модального окна
const closeButton = document.getElementById('closeButton');
// Массив для хранения координат прямоугольных рамок
let targets = [];
// URL-адрес изображения
let imageDataUrl;
// Количество кадров в секунду
let fps;
// Загруженный файл
let file;
// Цвет класса
let colorClass;
// Таймер для изменения размера
let resizeTimer;
// Номер текущего кадра
let numberFrame = 1;
// Массив для хранения использованных цветов
const usedColors = [];
// Номер аннотируемого кадра
let currentFrame;
// Имя класса аннотации
let className;
// Статус загрузки видео
let videoLoaded = false;

// Событие для ожидания получения fps
videoUploadInput.addEventListener('change', async function () {
    clearImageSlider();
    file = this.files[0];
    video.src = URL.createObjectURL(file);
    fps = await getFPS(file);
    videoLoaded = true;
});

// Функция получения FPS с бэка
async function getFPS(videoFile) {
    const formData = new FormData();
    formData.append("video", videoFile);
    try {
        const response = await fetch("/video/get-FPS", {
            credentials: 'include',
            method: "POST",
            body: formData
        });

        if (response.ok) {
            const responseData = await response.json();
            return responseData.fps;
        } else {
            throw new Error('Ошибка при получении FPS');
        }
    } catch (error) {
        console.error(error);
        throw error;
    }
}

//Событие для загрузки видео
dropArea.addEventListener('dragover', function (e) {
    e.preventDefault();
    dropArea.classList.add('drag-over');
});

//Событие для загрузки видео
dropArea.addEventListener('dragleave', function (e) {
    e.preventDefault();
    dropArea.classList.remove('drag-over');
});

//Событие для загрузки видео
dropArea.addEventListener('drop', async function (e) {
    clearImageSlider();
    e.preventDefault();
    dropArea.classList.remove('drag-over');

    file = e.dataTransfer.files[0];

    if (file.type.startsWith('video/')) {
        video.src = URL.createObjectURL(file);
    } else {
        alert('Пожалуйста, загрузите видео файл.');
    }
    fps = await getFPS(file);
    videoLoaded = true;
});

//Событие для запуска режима аннотации
startAnnotationBtn.addEventListener('click', () => {
    if (!isAnnotating && video.readyState >= 1) {
        isAnnotating = true;
        video.pause();
        setTimeout(startAnnotation, 200);
    }
});

//Событие для отображения окна добавления класса
addTarget.addEventListener('click', () => {
    video.pause();
    modal.classList.remove('hidden');
});

//Событие для удаления всех аннотаций с кадра
deleteAnnotationBtn.addEventListener('click', () => {
    clearFrame(currentFrame);
});

//Событие для удаления последней аннотации выбранного класса
cancelAnnotationBtn.addEventListener('click', () => {
    const className = document.getElementById('targets').value;
    cancelLastRectangle(className, currentFrame);
});

//Событие добавления нового класса аннотаций
annotationForm.addEventListener('submit', function (event) {
    event.preventDefault();
    // Сохраняем введенное название класса в переменную
    className = classNameInput.value;
    if (isStringFreeOfCyrillic(className)) {
        // Закрываем модальное окно
        modal.classList.add('hidden');
        // Делаем видео доступным снова
        video.classList.remove('none');
        createTarget(className);
        addOption(className);
        drawRectangles();
    }
    else {
        alert('Пожалуйста, используйте для названия класса латиницу!');
    }
});

//Событие начала отрисовки (начальная точка отрисовки) рамки аннотации
canvas.addEventListener('mousedown', (e) => {
    isDrawing = true;
    startX = e.offsetX;
    startY = e.offsetY;
});

//Событие для отрисовки рамки аннотации
canvas.addEventListener('mousemove', (e) => {
    if (isDrawing) {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        endX = e.offsetX;
        endY = e.offsetY;
        ctx.strokeStyle = colorClass;
        ctx.strokeRect(startX, startY, endX - startX, endY - startY);
        // Отрисовываем все рамки на canvas
        drawRectangles();
    }
});

//Событие для завершения отрисовки рамки аннотации
canvas.addEventListener('mouseup', () => {
    className = document.getElementById('targets').value;
    // Добавляем координаты рамки в массив
    if (className) {
        addAnnotation(className);
    } else {
        addAnnotation(classNameInput.value);
    }
    drawRectangles();
    isDrawing = false;
    console.log(targets);
});

//Событие для завершения режима аннотации
finishAnnotationBtn.addEventListener('click', async () => {
    if (isAnnotating) {
        clearSelectedImgFrame()
        canvas.style.display = 'none';
        video.style.display = 'block';
        // Делаем видео доступным снова
        video.classList.remove('none');
        isAnnotating = false;
        // deleteEmptyTarget();
        imageDataUrl = canvas.toDataURL();
        addOrUpdateFrameInSlider(currentFrame);
    }
});

//Событие отправки выбранного в слайдере размеченного кадра
submitAnnotation.addEventListener('click', async () => {
    const imgFrames = document.getElementById('imageSlider');
    let currentFrame;
    if (imgFrames) {
        Array.from(imgFrames.children).forEach((imgFrame) => {
            if (imgFrame.style.border[0] === '3') {
                const splitTargetId = imgFrame.id.split('_');
                currentFrame = +splitTargetId.pop();
            }
        });
    }
    if (currentFrame !== undefined) {
        await sendTargetsAndVideo(currentFrame);
    } else {
        alert('Пожалуйста, выберите размеченный фрейм для отправки!');
    }
});

// Закрываем модальное окно при нажатии на кнопку закрытия
closeButton.addEventListener('click', () => {
    modal.classList.add('hidden');
    video.classList.remove('none');
    if (!targets.name_class) {
        canvas.style.display = 'none';
        video.style.display = 'block';
        isAnnotating = false;
    }
});

//Событие для отслеживания нажатия кнопки загрузки видео
videoUploadButton.addEventListener("click", () => {
    videoUploadInput.click();
});

//Событие для отслеживания изменения размера окна браузера и адаптицая под него блока с видео или размечаемым кадром
$(window).on('resize', function () {
    if (isAnnotating) {
        clearTimeout(resizeTimer);
        const canvas = $('#canvas');
        canvas.off('mouseover mouseout mousemove mousedown mouseup click dblclick');
        resizeTimer = setTimeout(function () {
            if (!isLoading) {
                checkSizeCanvas()
                canvas.on('mouseover mouseout mousemove mousedown mouseup click dblclick');
            }
        }, 300);
    }
    const imageSlider = document.getElementById('imageSlider');
    if (imageSlider.childElementCount > 0) {
        resizeImageSlider(isAnnotating);
    }
});

function doesStringContainCyrillic(str) {
    const cyrillicRegex = /[а-яёА-ЯЁ]/;
    return cyrillicRegex.test(str);
}

function isStringFreeOfCyrillic(str) {
    return !doesStringContainCyrillic(str);
}

let isLoading = false;

//Событие для преобразования аннотаций выбранного для отправки размеченного кадра и его отправка на бэк
async function sendTargetsAndVideo(currentFrame) {
    // Вызываем функцию для отображения гифки с загрузкой
    showLoadingGif();
    isLoading = true;
    const type_annotation_id = parseInt($("#formats").val(), 10);
    let targetIsEmpty = true;
    let videoFile = file;
    let formatTarget = prepareFormData(currentFrame, type_annotation_id);
    for (const element of formatTarget.frame_data.bboxes_objects) {
        if (element.bboxes.length > 0) {
            targetIsEmpty = false;
            break;
        }
    }
    if (targetIsEmpty) {
        alert('Пожалуйста, разметьте выбранный кадр!');
        return;
    }
    const jsonData = JSON.stringify(formatTarget);
    const formData = new FormData();
    formData.append("video", videoFile);
    formData.append("jsonData", jsonData);
    const response = await fetch("/video/upload", {
        credentials: 'include',
        method: "POST",
        body: formData
    });

    // Скрываем изображение гифки после получения ответа от сервера
    hideLoadingGif();

    isLoading = false;

    if (response.ok) {
        const contentDisposition = response.headers.get('Content-Disposition');
        const filename = contentDisposition.match(/filename="(.*)"/)[1];
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename + ".zip";
        a.click();
    } else {
        throw new Error('Ошибка загрузки видео:', response.status);
    }
}

// Создаем функцию, которая будет показывать изображение гифки и скрывать блок с видео
function showLoadingGif() {
    const loadingGif = document.getElementById('loading-gif');
    loadingGif.style.display = 'flex';
    canvas.style.display = 'none';
    imageSlider.style.display = 'none';
}

// Создаем функцию, которая будет скрывать изображение гифки
function hideLoadingGif() {
    const loadingGif = document.getElementById('loading-gif');
    loadingGif.style.display = 'none';
    imageSlider.style.display = 'block';
    finishAnnotationBtn.click();
    resizeCanvas();
}

function prepareFormData(currentFrame, type_annotation_id) {
    const formatTarget = convertFormatTargetForBackend(currentFrame);
    const frameData = {
        "current_frame": currentFrame,
        "names_class": formatTarget.names_class,
        "frame_width": formatTarget.frame_width,
        "frame_height": formatTarget.frame_height,
        "bboxes_objects": formatTarget.bboxes_objects
    };
    const formData = {
        "type_annotation_id": type_annotation_id,
        "frame_data": frameData
    };
    return formData;
}

//Функция для конвертации формата хранения аннотаций для бэка
function convertFormatTargetForBackend(currentFrame) {
    let namesClass = [];
    targets.forEach((target) => {
        if (target.current_frame === currentFrame) {
            namesClass.push(target.name_class);
        }
    });
    if (namesClass) {
        let formatTarget = {
            "current_frame": currentFrame, "names_class": namesClass, "frame_width": '', "frame_height": '', "bboxes_objects": []
        }
        targets.forEach((target) => {
            if (target.current_frame === currentFrame) {
                let newBboxObject = {
                    "name_class": target.name_class, "bboxes": []
                };
                target.bbox.forEach((bbox) => {
                    let formatBBox = [bbox['startX'], bbox['startY'], bbox['width'], bbox['height']];
                    newBboxObject.bboxes.push(formatBBox);
                });
                formatTarget.frame_width = target.native_width;
                formatTarget.frame_height = target.native_height;
                formatTarget.bboxes_objects.push(newBboxObject);
            }
        });
        return formatTarget;
    }
}

//Функция изменения размера размечаемого кадра
function resizeCanvas() {
    const canvas = document.getElementById('canvas');
    let rect = canvas.getBoundingClientRect();
    canvas.width = rect.width;
    canvas.height = rect.height;
}

//Функция для проверки на изменение размера размечаемого кадра
function checkSizeCanvas() {
    const canvas = document.getElementById('canvas');
    let rect = canvas.getBoundingClientRect();
    if (canvas.width !== Math.round(rect.width) && canvas.height !== Math.round(rect.height)) {
        startX = null;
        startY = null;
        endX = null;
        endY = null;
        showFrameOnCanvas(video.currentTime * fps);
    }
}

//Функция добавления нового класса для разметки в меню выбора 
function addOption(className) {
    const liCaseTargets = document.getElementById("caseTargets");
    const liAddCaseTargets = document.getElementById("addCaseTargets");
    const select = document.getElementById("targets");
    const option = document.createElement("option");
    liCaseTargets.style.display = "block";
    liAddCaseTargets.style.display = "block";
    addTarget.style.display = "block";
    colorClass = getColorClass(className);
    // проверяем, существует ли уже опция с таким же значением
    const existingOption = Array.from(select.options).find(opt => opt.value === className);
    if (!existingOption) {
        option.text = className;
        option.value = className;
        option.dataset.class = "colors";
        option.dataset.style = `background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16'%3E%3Ccircle id='c' cx='8' cy='8' r='8' fill='${colorClass}'/%3E%3C/svg%3E");`;
        select.add(option);
        option.selected = true;
    } else {
        select.style.setProperty("--color", colorClass);
        // если опция уже существует, выбираем ее
        existingOption.selected = true;
    }

    $(function () {
        $.widget("custom.iconselectmenu", $.ui.selectmenu, {
            _renderItem: function (ul, item) {
                var li = $("<li>"),
                    wrapper = $("<div>", { text: item.label });

                if (item.disabled) {
                    li.addClass("ui-state-disabled");
                }

                $("<span>", {
                    style: item.element.attr("data-style"),
                    "class": "ui-icon " + item.element.attr("data-class")
                }).appendTo(wrapper);

                return li.append(wrapper).appendTo(ul);
            }
        });

        $("#targets")
            .iconselectmenu()
            .iconselectmenu("menuWidget")
            .addClass("ui-menu-icons colors");

    });

    $("#targets")
        .iconselectmenu("refresh")
        .on("iconselectmenuchange", function () {
            const className = $("#targets").val();
            createTarget(className);
            colorClass = getColorClass(className);
        });
}

// Функция для отрисовки всех рамок на canvas
function drawRectangles() {
    targets.forEach((target) => {
        if (target.current_frame === currentFrame) {
            let k = canvas.height / target.native_height;
            target.bbox.forEach((rect, index) => {
                drawRectangle(rect, target.name_class, target.color_class, index, k)
            });
        }
    });
}

// Функция для отрисовки рамки аннотации
function drawRectangle(rect, name_class, color_class, index, k = 1) {
    ctx.beginPath();
    ctx.strokeStyle = color_class;
    ctx.rect(rect.startX * k, rect.startY * k, rect.width * k, rect.height * k);
    ctx.stroke();
    ctx.fillStyle = color_class;
    ctx.font = 'bold ' + Math.round(canvas.width * 0.015) + 'px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(name_class + (index + 1), rect.startX * k + rect.width * k / 2, rect.startY * k - 5);
}

//Функция добавления рамки аннотации
function addAnnotation(className) {
    // Рассчитываем ширину и высоту рамки
    let width = Math.abs(endX - startX);
    let height = Math.abs(endY - startY);
    // Найти объект с нужным name_class
    let existingClass = targets.find(item => item.name_class === className && item.current_frame === currentFrame);
    if (existingClass && startX != null) {
        let k = canvas.height / existingClass.native_height;
        // Добавить новую информацию в bbox
        existingClass.bbox.push({
            startX: Math.round(Math.min(startX, endX) / k),
            startY: Math.round(Math.min(startY, endY) / k),
            width: Math.round(Math.abs(width) / k),
            height: Math.round(Math.abs(height) / k)
        });
        startX = null;
    }
}

//Функция создания нового класса аннотирования
function createTarget(className) {
    let existingClass = targets.find(item => item.name_class === className && item.current_frame === currentFrame);
    let color_class = getColorClass(className);
    if (!color_class) {
        color_class = generateUniqueColor();
    }
    if (!existingClass) {
        targets.push({
            color_class: color_class,
            name_class: className,
            current_frame: currentFrame,
            native_width: canvas.width,
            native_height: canvas.height,
            bbox: []
        });
    } else {
        addAnnotation(className);
    }
}

//Функция удаления класса без аннотаций
function deleteEmptyTarget() {
    targets = targets.filter((target) => target.bbox.length !== 0);
}

//Функция очистки кадра от всех аннотаций
function clearFrame(currentFrame) {
    // Найти объект с нужным name_class
    targets.forEach((target) => {
        if (target.current_frame === currentFrame) {
            target.bbox.length = 0;
        }
    });
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    drawRectangles();
}

//Функция удаления последней рамки выбранного класса
function cancelLastRectangle(className, currentFrame) {
    // Найти объект с нужным name_class
    let existingClass = targets.find(item => item.name_class === className && item.current_frame === currentFrame);
    if (existingClass) {
        // Добавить новую информацию в bbox
        existingClass.bbox.pop();
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        // Отрисовываем все рамки на canvas
        drawRectangles();
    }
}

//Функция установки размера выбранного кадра
function setSizeCanvas() {
    const video = document.querySelector('video');
    const canvas = document.querySelector('canvas');
    // Установить размеры canvas
    canvas.width = video.clientWidth;
    canvas.height = video.clientHeight;
}

//Функция для добавления или обновления аннотрованного кадра в слайдер выбора кадров
function addOrUpdateFrameInSlider(currentFrame) {
    const imageSlider = document.getElementById('imageSlider');
    const img = document.createElement("img");
    const frame = document.getElementById('current_frame_' + currentFrame);
    if (frame && imageDataUrl) {
        frame.src = imageDataUrl;
    } else if (imageDataUrl) {
        img.classList.add("sliderImage");
        img.id = "current_frame_" + currentFrame;
        img.src = imageDataUrl;
        img.alt = "Размеченный кадр " + currentFrame;
        img.title = "Размеченный кадр " + numberFrame;
        img.addEventListener('click', function () {
            showFrameOnCanvas(currentFrame);
        });
        imageSlider.appendChild(img);
        numberFrame++;
        resizeImageSlider(isAnnotating);
    }
}

//Функция для отображения выбранного в слайдере аннотированного кадра
function showFrameOnCanvas(currentFrame) {
    let timeToSeek = currentFrame / fps;
    clearSelectedImgFrame();
    const imgFrame = document.getElementById('current_frame_' + currentFrame);
    if (imgFrame) {
        imgFrame.style.border = '3px solid green';
    }
    if (isAnnotating) {
        canvas.style.display = 'none';
        video.style.display = 'block';
        video.currentTime = timeToSeek;
        setTimeout(function () {
            startAnnotation();
        }, 200);
    } else {
        video.currentTime = timeToSeek;
        setTimeout(function () {
            startAnnotationBtn.click();
        }, 200);
    }
}

//Функция отмены выбора размеченного кадра в слайдере
function clearSelectedImgFrame() {
    const imgFrames = document.getElementById('imageSlider');
    if (imgFrames) {
        Array.from(imgFrames.children).forEach((imgFrame) => {
            imgFrame.style.border = '0px solid green';
        });
    }
}

// Функция для включения режима аннотирования
function startAnnotation() {
    if (!videoLoaded) {
        isAnnotating = false;
        alert('Пожалуйста, подождите, пока видео загрузится и FPS будет получен.');
        return;
    }
    setSizeCanvas();
    ctx = canvas.getContext('2d');
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    video.style.display = 'none';
    canvas.style.display = 'block';
    currentFrame = Math.round(video.currentTime * fps);
    video.classList.add('none');
    if (addTarget.style.display === '') {
        modal.classList.remove('hidden');
    } else {
        className = document.getElementById('targets').value;
        createTarget(className);
        drawRectangles();
    }
}

//Функция для генерации уникального цвета для добавляемого класса
function generateUniqueColor() {
    const maxColors = 20;
    if (usedColors.length >= maxColors) {
        return 'rgb(0, 0, 0)'; // стандартный цвет, если максимальное количество цветов уже использовано
    }
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const averageBrightness = getAverageBrightness(imageData);
    let color;
    do {
        const baseHue = Math.floor(Math.random() * 7) / 6; // randomly select one of the seven main colors
        const tint = Math.random() * 0.2; // add a random tint of up to 20%
        const hue = (baseHue + tint) % 1;
        color = hslToRgb(hue, 0.8, 0.5); // increase saturation to 0.8 and lightness to 0.5 to ensure that the color is saturated and not too light or dark
    } while (usedColors.findIndex(usedColor => usedColor.every((usedColorValue, i) => usedColorValue === color[i])) !== -1 || !isHighContrastColor(color, averageBrightness));
    usedColors.push(color);
    return `rgb(${color.join(',')})`;
}

// функция для преобразования HSL в RGB
function hslToRgb(h, s, l) {
    let r, g, b;
    if (s === 0) {
        r = g = b = l;
    } else {
        const hue2rgb = (p, q, t) => {
            if (t < 0) t += 1;
            if (t > 1) t -= 1;
            if (t < 1 / 6) return p + (q - p) * 6 * t;
            if (t < 1 / 2) return q;
            if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
            return p;
        };
        const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
        const p = 2 * l - q;
        r = hue2rgb(p, q, h + 1 / 3);
        g = hue2rgb(p, q, h);
        b = hue2rgb(p, q, h - 1 / 3);
    }
    return [Math.round(r * 255), Math.round(g * 255), Math.round(b * 255)];
}

// функция для получения средней яркости изображения
function getAverageBrightness(imageData) {
    let totalBrightness = 0;
    const numPixels = imageData.data.length / 4;
    for (let i = 0; i < numPixels; i++) {
        const r = imageData.data[i * 4];
        const g = imageData.data[i * 4 + 1];
        const b = imageData.data[i * 4 + 2];
        const brightness = (r * 0.299 + g * 0.587 + b * 0.114) / 255;
        totalBrightness += brightness;
    }
    return totalBrightness / numPixels;
}

// функция для проверки, является ли цвет с высокой контрастностью
function isHighContrastColor(color, averageBrightness) {
    const contrast = Math.abs(averageBrightness - (color[0] * 0.299 + color[1] * 0.587 + color[2] * 0.114) / 255);
    return contrast > 0.1;
}

//Функция для получения цвета выбранного в селекте класса аннотаций
function getColorClass(className) {
    let colorClass = targets.find(item => item.name_class === className);
    if (colorClass) {
        return colorClass.color_class;
    }
}

//Функция поддержания размера слайдера соответствующего размеру блока с видео или кадром
function resizeImageSlider(isAnnotating) {
    const imageSlider = $('#imageSlider');
    if (isAnnotating) {
        imageSlider.css('height', canvas.clientHeight + 'px');
    }
    else {
        imageSlider.css('height', video.clientHeight + 'px');
    }
}

//Функция очистки слайдера
function clearImageSlider() {
    const imageSlider = $('#imageSlider');
    finishAnnotationBtn.click();
    imageSlider.empty(); // удаляем все дочерние элементы
}


async function loadFormats() {
    const response = await fetch('/get-types-dataset');
    if (response.ok) {
        const formats = await response.json();
        const formatSelect = document.getElementById('formats');
        formats.forEach(format => {
            const option = document.createElement('option');
            option.value = format.id;
            option.textContent = format.name;
            formatSelect.appendChild(option);
        });
    } else {
        console.error(`Failed to load formats: ${response.status} ${response.statusText}`);
    }
}

// вызываем функцию при загрузке страницы
loadFormats();
