/* Система заметок */

// Получение зависимостей
const express = require('express')
const express_session = require('express-session')
const bodyParser = require('body-parser')
const sqlite = require('sqlite3')
const user_operations = require('./my_modules/user_operations')
const sync_operations = require('./my_modules/sync_operations')

// Создание переменных
const app = express()
const db = new sqlite.Database('db.sqlite3')
let urlEncodedParser = bodyParser.urlencoded({extended: false})

// Настройка
app.set('view engine', 'ejs')
app.use(express_session({secret: 'super_secret_key'}))
app.use('/public', express.static('public'))
app.use(bodyParser.json())
app.use(urlEncodedParser)

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
app.post('/login', ((req, res) => {
    user_operations.log(req, res)
}))

/* Страница регистрации */
app.get('/reg', ((req, res) => {
    if (req.session.logged) {
        res.redirect('/')
    } else {
        res.render('reg')
    }
}))

/* Регистрация */
app.post('/reg', ((req, res) => {
    user_operations.reg(req, res)
}))

/* Выход */
app.get('/logout', ((req, res) => {
    req.session.logged = false
    req.session.login = ''
    res.render('msg', {msg: "Вы успешно вышли."})
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
            if (data !== []) {
                if (data[0] !== undefined) {
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

/* Изменение записи */
app.post('/change-note/:id', (req, res) => {
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

/* Страница создания записи */
app.get('/create-note', ((req, res) => {
    if (req.session.logged) {
        res.render('new-note')
    } else {
        res.redirect('/login')
    }
}))

/* Создание записи */
app.post('/create-note', (req, res) => {
    if (req.session.logged) {
        db.get(`select id from users where login = '${req.session.login}';`, (err, data) => {
            if (err) {
                throw err
            }
            if (data) {
                db.run(`insert into notes (heading, text, userId) values ('${req.body.heading}', '${req.body.text}', ${data.id})`)
                res.redirect('/')
            } else {
                res.render('msg', {msg: 'Ошибка'})
            }
        })
    } else {
        res.redirect('/login')
    }
})

/* Удаление записи (без страницы, так как запрос посылается с помощью fetch из страницы записи) */
app.post('/drop-note', (req, res) => {
    if (req.session.logged) {
        db.get(`select users.login from notes inner join users on notes.userId = users.id where notes.id = ${req.body.id};`, (err, data) => {
            if (err) {
                res.status(400)
                console.log(err)
                res.end()
                return
            }
            if (data.login === req.session.login) {
                db.run(`delete from notes where id = ${req.body.id};`, (err) => {
                    if (err) {
                        throw err
                    }
                    res.status(200)
                    res.end()
                })
            } else {
                res.status(202)
            }
        })
    } else {
        res.redirect('/login')
    }
})

/* Синхронизация */
app.post('/sync', (req, res) => {
    const login = req.body.login
    const password = req.body.password
    const notes_text = req.body.notes
    const type = req.body.type
    db.get(`select id, pass from users where login = '${login}';`, (err, data) => {
        if (err) {
            console.log('error when getting password from db')
            throw err
        }
        const id = data.id
        if (data) {
            // Проверяем, верно ли указан пароль
            if (data.pass === password) {
                // Преобразовываем полученную строку в массив записей
                let notes = notes_text.split('%*%')
                if (notes[0] === '') {
                    notes = []
                }
                notes.forEach((item, index) => {
                    notes[index] = JSON.parse(item)
                })
                // В зависимости от выбранного типа выполняем синхронизацию
                if (type === 'upload') {
                    sync_operations.upload(notes, id)
                    res.status(200)
                    res.end()
                } else if (type === 'upload-and-download') {
                    sync_operations.upload(notes, id)
                    sync_operations.send_not_synced(notes, id, res)
                } else if (type === 'download') {
                    sync_operations.send_not_synced(notes, id, res)
                } else if (type === 'hard-upload') {
                    sync_operations.hard_upload(notes, id)
                    res.status(200)
                    res.end()
                } else if (type === 'hard-download') {
                    sync_operations.hard_download(id, res)
                }
            } else {
                res.status(201)
                res.end()
            }
        } else {
            res.status(202)
            res.end()
        }
    })
})

// Страница с презентацией настольного приложения
app.get('/app', (req, res) => {
    res.render('app')
})

app.listen(3000, () => {
    console.log('server started successfully')
})
