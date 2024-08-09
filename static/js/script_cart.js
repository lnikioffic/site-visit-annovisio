// Массив для хранения датасетов в корзине
let cart = [];

// Функция для добавления датасета в корзину
function addToCart(dataset) {
    // Ограничение на количество датасетов в корзине
    if (cart.length >= 10) {
        alert("Максимальное количество датасетов в корзине - 10");
        return;
    }

    // Проверяем, нет ли уже такого датасета в корзине
    const index = cart.findIndex(item => item.id === dataset.id);
    if (index !== -1) {
        alert("Этот датасет уже добавлен в корзину");
        return;
    }
    else {
        // Добавляем датасет в корзину
        cart.push(dataset);
        alert('Датасет добавлен в корзину');
    }

    // сохраняем корзину в localStorage
    saveCartToLocalStorage();

    // Обновляем корзину
    updateCart();
}

function updateDeleteBtn(removeSelectedBtn) {
    // Функция для удаления датасета из корзины
    removeSelectedBtn.addEventListener('click', function () {
        // Находим все выбранные чекбоксы
        const selectedCheckboxes = document.querySelectorAll('.dataset-checkbox:checked');

        // Перебираем выбранные чекбоксы и удаляем соответствующие датасеты из корзины
        const indicesToRemove = [];
        selectedCheckboxes.forEach(checkbox => {
            const index = parseFloat(checkbox.dataset.index);
            indicesToRemove.push(index);
        });

        // Удаляем датасеты из корзины в обратном порядке, чтобы избежать проблем с индексами
        for (let i = indicesToRemove.length - 1; i >= 0; i--) {
            cart.splice(indicesToRemove[i], 1);
        }

        // Сохраняем корзину в localStorage
        saveCartToLocalStorage();

        // Обновляем корзину на странице
        updateCart();
    });
}

function updateCheckboxes(selectAllCheckbox, datasetCheckboxes, removeSelectedBtn) {
    // Добавляем обработчик события на чекбоксы датасетов, чтобы обновлять значение чекбокса "Выбрать все"
    datasetCheckboxes.forEach(checkbox => {
        checkbox.addEventListener('change', function () {
            // Обновляем значение чекбокса "Выбрать все"
            selectAllCheckbox.checked = datasetCheckboxes.length === Array.from(datasetCheckboxes).filter(cb => cb.checked).length;

            // Показываем или скрываем кнопку "Удалить выбранные" в зависимости от того, выбран ли хотя бы один чекбокс
            if (Array.from(datasetCheckboxes).some(cb => cb.checked)) {
                removeSelectedBtn.style.display = 'block';
            } else {
                removeSelectedBtn.style.display = 'none';
            }
        });
    });

    // Добавляем обработчик события на чекбокс "Выбрать все"
    selectAllCheckbox.addEventListener('change', function () {
        // Перебираем чекбоксы датасетов и устанавливаем им соответствующее значение
        datasetCheckboxes.forEach(checkbox => {
            checkbox.checked = this.checked;
        });

        // Показываем или скрываем кнопку "Удалить выбранные" в зависимости от того, выбран ли хотя бы один чекбокс
        if (Array.from(datasetCheckboxes).some(cb => cb.checked)) {
            removeSelectedBtn.style.display = 'block';
        } else {
            removeSelectedBtn.style.display = 'none';
        }
    });
}

// Функция для обновления корзины
function updateCart() {
    // Обнуляем корзину
    let cartContainer = document.querySelector(".datasets-cart");
    if (cartContainer != null) {
        // Создаем элемент .datasets-func, если он отсутствует в корзине
        const datasetsFunc = document.querySelector('.datasets-func') || document.createElement('div');
        datasetsFunc.className = 'datasets-func';
        datasetsFunc.innerHTML = `
            <label><input type="checkbox">Выбрать все</label>
            <button class="remove-selected-btn">Удалить выбранные</button>
        `;

        // Удаляем все блоки .dataset-cart и .datasets-func, если они есть в корзине
        cartContainer.querySelectorAll('.dataset-cart, .datasets-func').forEach(dataset => {
            dataset.remove();
        });

        // Вставляем .datasets-func в начало .datasets-cart
        cartContainer.insertBefore(datasetsFunc, cartContainer.firstChild);

        // Перебираем датасеты в корзине и добавляем их в корзину на страницу
        cart.forEach((dataset, index) => {
            cartContainer.innerHTML += `
          <div class="dataset-cart">
            <div class="cart-info-container"><input type="checkbox" class="dataset-checkbox" data-index="${index}"></div>
            <a href="/dataset/${dataset.id}" style="text-decoration: none; color: black;">
            <div class="img-cart-container"><img src="/static/${dataset.first_frame}" alt="${dataset.name}"></div>
            <div class="cart-info-container">
              <h3>Название датасета: ${dataset.name}</h3>
              <p>Цена: ${dataset.price}$</p></a>
            </div>
          </div>`;
        });

        // Обновляем количество и общую сумму в корзине
        let quantity = document.querySelector("#quantity");
        let totalPrice = document.querySelector("#total-price");
        quantity.textContent = cart.length;
        totalPrice.textContent = cart.reduce((acc, dataset) => acc + dataset.price, 0) + "$";

        // Если в корзине нет датасетов, удаляем .datasets-func
        if (cart.length === 0) {
            datasetsFunc.remove();
        }

        const selectAllCheckbox = document.querySelector('.datasets-func input[type="checkbox"]');
        const datasetCheckboxes = document.querySelectorAll('.dataset-checkbox');
        const removeSelectedBtn = document.querySelector('.remove-selected-btn');
        updateDeleteBtn(removeSelectedBtn);
        updateCheckboxes(selectAllCheckbox, datasetCheckboxes, removeSelectedBtn);
    }
}

// Функция для отправки заказа на бэкенд
function sendOrder() {
    // Отправляем заказ на бэкенд, например, с помощью fetch API
    fetch("/api/orders", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify(cart),
    })
        .then((response) => response.json())
        .then((data) => {
            // Обрабатываем ответ от бэкенда
            console.log(data);

            // Обнуляем корзину
            cart = [];
            updateCart();
        })
        .catch((error) => {
            console.error("Error:", error);
        });
}

// Функция для проверки истечения срока хранения корзины в localStorage
function isCartExpired() {
    let cartExpiration = localStorage.getItem("cartExpiration");
    if (!cartExpiration) {
        return true;
    }
    let currentTime = new Date().getTime();
    if (currentTime > parseInt(cartExpiration)) {
        return true;
    }
    return false;
}

// Функция для загрузки корзины из localStorage
function loadCartFromLocalStorage() {
    if (isCartExpired()) {
        cart = [];
        return;
    }
    let cartData = localStorage.getItem("cart");
    if (cartData) {
        cart = JSON.parse(cartData);
    } else {
        cart = [];
    }
    updateCart();
}

// Функция для сохранения корзины в localStorage
function saveCartToLocalStorage() {
    localStorage.setItem("cart", JSON.stringify(cart));
    let expirationTime = new Date().getTime() + 30 * 24 * 60 * 60 * 1000; // 30 дней в миллисекундах
    localStorage.setItem("cartExpiration", expirationTime);
}

// Загружаем корзину из localStorage при загрузке страницы
loadCartFromLocalStorage();

// Навешиваем обработчик события click на кнопки "Добавить в корзину"
let addToCartBtns = document.querySelectorAll(".add-to-cart-btn");
addToCartBtns.forEach((btn) => {
    btn.addEventListener("click", (event) => {
        event.preventDefault(); // Отменяем стандартное действие ссылки

        // Получаем id датасета из атрибута data-dataset-id
        let datasetId = event.target.id;

        // Отправляем запрос на бэк для получения данных о датасете
        fetch(`/get-dataset/${datasetId}`)
            .then((response) => response.json())
            .then((data) => {
                // Создаем объект датасета
                let dataset = {
                    id: data.id,
                    name: data.name,
                    description: data.name,
                    price: parseFloat(data.price),
                    count_frames: data.count_frames,
                    first_frame: data.first_frame,
                    second_frame: data.second_frame,
                    categories: '',
                    format: data.type_dataset.name,
                    size: data.size,
                };

                // Добавляем датасет в корзину
                addToCart(dataset);
            })
            .catch((error) => {
                console.error("Error:", error);
            });
    });
});



