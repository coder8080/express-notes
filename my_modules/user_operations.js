/*Функции, связанные с работой с пользователем.*/

// Получаем модуль для работы с базой данных
let sqlite = require('sqlite3')
// Создаём объект базы данных
let db = new sqlite.Database('db.sqlite3')

/**
 * Авторизация пользователя на сайте
 * @param {object} req - объект запроса express
 * @param {object} res - объект ответа express
 * */
module.exports.log = (req, res) => {
    // Отправляем запрос базе данных
    db.get(`select * from users where login = '${req.body.login}';`, (err, data) => {
        // Если ошибка, то выбрасываем её
        if (err) {
            throw err
        }
        // Проверяем, вернула ли база данных какую-либо информацию
        if (data) {
            // Проверяем пароль на совпадение
            // Над шифрованием пароля ещё работаю
            if (data.pass === req.body.password) {
                req.session.logged = true
                console.log(`login is ${req.body.login}`)
                req.session.login = req.body.login
                res.redirect('/')
            } else {
                res.render('msg', {msg: 'Неверный пароль.'})
            }
        } else {
            res.render('msg', {msg: 'Нет аккаунта с таким логином.'})
        }
    })
}

/**
 * Регистрация пользователя на сайте
 * @param {object} req - объект запроса express
 * @param {object} res - объект ответа express
 * */
module.exports.reg = (req, res) => {
    // Получаем данные из запроса
    let login = req.body.login
    let pass = req.body.password
    // Проверяем, существует ли аккаунт с таким логином
    db.get(`select id from users where login = '${login}';`, (err, data) => {
        if (err) {
            throw err
        }
        if (data) {
            res.render('msg', {msg: 'Аккаунт с таким логином уже существует.'})
        } else {
            // Создаём новый аккаунт
            db.run(`insert into users (login, pass) values ('${login}', '${pass}');`, (err) => {
                if (err) {
                    throw err
                }
                // Авторизуем пользователя
                req.session.logged = true
                req.session.login = login
                // Перенаправляем пользователя на главную страницу
                res.redirect('/')
            })
        }
    })
}
