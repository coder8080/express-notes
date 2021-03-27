/* Система заметок */

// Получение зависимостей
const express = require('express')
const express_session = require('express-session')
const bodyParser = require('body-parser')
const sqlite = require('sqlite3')
const operations = require('./my_modules/user_operations')

// Создание переменных
const app = express()
const db = new sqlite.Database('db.sqlite3')
const urlEncodedParser = bodyParser.urlencoded({extended: false})

// Настройка
app.set('view engine', 'ejs')
app.use(express_session({secret: 'super_secret_key'}))
app.use('/public', express.static('public'))

// Отслеживание url адресов

/* Главная страница */
app.get('/', ((req, res) => {
    if (req.session.logged) {
        res.redirect('/profile')
    } else {
        res.redirect('/login')
    }
}))

/* Страница входа */
app.get('/login', ((req, res) => {
    if (req.session.logged) {
        res.redirect('/profile')
    } else {
        res.render('login')
    }
}))

/* Вход */
app.post('/login', urlEncodedParser, ((req, res) => {
    operations.log(req, res)
}))

/* Профиль */
app.get('/profile', ((req, res) => {
    if (req.session.logged) {
        db.all(`select heading, notes.id from notes inner join users on notes.userId = users.id where users.login = '${req.session.login}';`, (err, data) => {
            if (err) {
                throw err
            }
            let notes_arr
            let are_notes
            console.log(data)
            if (data) {
                if (data[0]) {
                    are_notes = true
                    notes_arr = data
                } else {
                    are_notes = true
                    notes_arr = [data]
                }
            } else {
                are_notes = false
            }
            res.render('profile', {login: req.session.login, are_notes: are_notes, notes: notes_arr})
        })
    } else {
        res.redirect('/login')
    }
}))

/* Страница записи */
app.get('/note/:id', ((req, res) => {
    // Пропускаем только вошедших пользователей
    if (req.session.logged) {
        // Получаем логин пользователя, которому принадлежит запись
        db.get(`select users.login from notes inner join users on notes.userId = users.id where notes.id = '${req.params.id}';`, (err, data) => {
            if (err) {
                throw err
            }
            if (data) {
                // Проверяем, принадлежит ли запись запрашивающему её пользователю
                if (data.login === req.session.login) {
                    // Получаем запись и отправляем её пользователю
                    db.get(`select * from notes where notes.id = '${req.params.id}';`, (err, data) => {
                        console.log(data)
                        if (data) {
                            res.render('note', {note: data})
                        } else {
                            // Если запись вдруг исчезла, выдаём ошибку
                            res.render('msg', {msg: 'Ошибка'})
                        }
                    })
                } else {
                    res.render('msg', {msg: 'У вас нет записи с таким титулом'})
                }
            } else {
                res.render('msg', {msg: 'У вас нет записи с таким титулом'})
            }
        })
    } else {
        res.redirect('/login')
    }
}))

/* Страница изменения записи */
app.get('/change-note/:id', ((req, res) => {
    if (req.session.logged) {
        // Получаем логин пользователя, которому принадлежит запись
        db.get(`select users.login from notes inner join users on notes.userId = users.id where notes.id = '${req.params.id}';`, (err, data) => {
            if (err) {
                throw err
            }
            if (data) {
                // Проверяем, принадлежит ли запись запрашивающему её пользователю
                if (data.login === req.session.login) {
                    // Получаем запись и отправляем её пользователю
                    db.get(`select * from notes where notes.id = '${req.params.id}';`, (err, data) => {
                        console.log(data)
                        if (data) {
                            res.render('change-note', {note: data})
                        } else {
                            // Если запись вдруг исчезла, выдаём ошибку
                            res.render('msg', {msg: 'Ошибка'})
                        }
                    })
                } else {
                    res.render('msg', {msg: 'У вас нет записи с таким титулом'})
                }
            } else {
                res.render('msg', {msg: 'У вас нет записи с таким титулом'})
            }
        })
    } else {
        res.redirect('/login')
    }
}))

app.post('/change-note/:id', urlEncodedParser, (req, res) => {
    if (req.session.logged) {
        // Получаем логин пользователя, которому принадлежит запись
        db.get(`select users.login from notes inner join users on notes.userId = users.id where notes.id = '${req.params.id}';`, (err, data) => {
            if (err) {
                throw err
            }
            if (data) {
                // Проверяем, принадлежит ли запись запрашивающему её пользователю
                if (data.login === req.session.login) {
                    // Получаем запись и отправляем её пользователю
                    db.get(`select heading, text from notes where id = ${req.params.id};`, (err, data) => {
                        if (err) {
                            throw err
                        }
                        if (data) {
                            if (data.heading !== req.body.heading) {
                                // Если в название были внесены изменения, то сохраняем их
                                db.run(`update notes set heading = '${req.body.heading}' where id = ${req.params.id};`, (err) => {
                                    if (err) {
                                        throw err
                                    }
                                })
                            }
                            if (data.text !== req.body.text) {
                                // Если в текст были внесены изменения, сохраняем их
                                db.run(`update notes set text = '${req.body.text}' where id = ${req.params.id};`, (err) => {
                                    if (err) {
                                        throw err
                                    }
                                })
                            }
                            res.redirect(`/note/${req.params.id}`)
                        } else {
                            // Если запись вдруг исчезла, выдаём ошибку
                            res.render('msg', {msg: 'Ошибка'})
                        }
                    })
                } else {
                    res.render('msg', {msg: 'У вас нет записи с таким титулом'})
                }
            } else {
                res.render('msg', {msg: 'У вас нет записи с таким титулом'})
            }
        })
    } else {
        res.redirect('/login')
    }
})

app.get('/create-note', ((req, res) => {
    if (req.session.logged) {
        res.render('new-note')
    } else {
        res.redirect('/login')
    }
}))

app.post('/create-note', urlEncodedParser, (req, res) => {
    if (req.session.logged) {
        db.get(`select id from users where login = '${req.session.login}';`, (err, data) => {
            if (err) {
                throw err
            }
            if (data) {
                console.log()
                db.run(`insert into notes (heading, text, userId) values ('${req.body.heading}', '${req.body.text}', ${data.id})`)
                res.redirect('/')
            }
            else {
                res.render('msg', {msg: 'Ошибка'})
            }
        })
    } else {
        res.redirect('/login')
    }
})

app.listen(3000, () => {
    console.log('server started successfully')
})
