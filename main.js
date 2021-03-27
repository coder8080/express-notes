const express = require('express')
const express_session = require('express-session')
const bodyParser = require('body-parser')
const sqlite = require('sqlite3')
const operations = require('./my_modules/user_operations')

const app = express()
const db = new sqlite.Database('db.sqlite3')
const urlEncodedParser = bodyParser.urlencoded({extended: false})

app.set('view engine', 'ejs')
app.use(express_session({secret: 'super_secret_key'}))
app.use('/public', express.static('public'))

app.get('/', ((req, res) => {
    if (req.session.logged) {
        res.redirect('/profile')
    } else {
        res.redirect('/login')
    }
}))

app.get('/login', ((req, res) => {
    if (req.session.logged) {
        res.redirect('/profile')
    } else {
        res.render('login')
    }
}))

app.post('/login', urlEncodedParser, ((req, res) => {
    operations.log(req, res)
}))

app.get('/profile', ((req, res) => {
    if (req.session.logged) {
        db.get(`select heading, notes.id from notes inner join users on notes.userId = users.id where users.login = '${req.session.login}';`, (err, data) => {
            if (err) {
                throw err
            }
            let notes_arr
            let are_notes
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

app.get('/note/:id', ((req, res) => {
    if (req.session.logged) {
        db.get(`select users.login from notes inner join users on notes.userId = users.id where notes.id = '${req.params.id}';`, (err, data) => {
            if (err) {
                throw err
            }
            if (data) {
                if (data.login === req.session.login) {
                    db.get(`select * from notes where notes.id = '${req.params.id}';`, (err, data) => {
                        console.log(data)
                        if (data) {
                            res.render('note', {note: data})
                        } else {
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

app.get('/change-note/:id', ((req, res) => {
    if (req.session.logged) {
        db.get(`select users.login from notes inner join users on notes.userId = users.id where notes.id = '${req.params.id}';`, (err, data) => {
            if (err) {
                throw err
            }
            if (data) {
                if (data.login === req.session.login) {
                    db.get(`select * from notes where notes.id = '${req.params.id}';`, (err, data) => {
                        console.log(data)
                        if (data) {
                            res.render('change-note', {note: data})
                        } else {
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
        db.get(`select users.login from notes inner join users on notes.userId = users.id where notes.id = '${req.params.id}';`, (err, data) => {
            if (err) {
                throw err
            }
            if (data) {
                if (data.login === req.session.login) {
                    db.get(`select heading, text from notes where id = ${req.params.id};`, (err, data) => {
                        if (err) {
                            throw err
                        }
                        if (data) {
                            if (data.heading !== req.body.heading) {
                                db.run(`update notes set heading = '${req.body.heading}' where id = ${req.params.id};`, (err) => {
                                    if (err) {
                                        throw err
                                    }
                                })
                            }
                            if (data.text !== req.body.text) {
                                db.run(`update notes set text = '${req.body.text}' where id = ${req.params.id};`, (err) => {
                                    if (err) {
                                        throw err
                                    }
                                })
                            }
                            res.redirect(`/note/${req.params.id}`)
                        } else {
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

app.listen(3000, () => {
    console.log('server started successfully')
})
