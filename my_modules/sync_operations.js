const sqlite = require('sqlite3')
const db = new sqlite.Database('db.sqlite3')

/**
 * Функция загрузки записей, не сохранённых на сервере
 * @param {Array} notes - список полученных от приложения записей
 * @param {Number} userId - id пользователя, проводящего синхронизацию
 * */
module.exports.upload = function upload(notes, userId) {
    // Для повышения производительности асинхронно обрабатываем полученные записи
    notes.forEach((item) => {
        db.get(`select text from notes where heading = '${item.heading}' and userId = ${userId};`, (err, data) => {
            if (err) {
                throw err
            }
            if (!data) {
                // Если у пользователя нет заметки с таким заголовком, создаём её
                db.run(`insert into notes (heading, text, userId) values ('${item.heading}', '${item.text}', ${userId});`, (err) => {
                    if (err) {
                        console.log('cant create new note in db')
                        throw err
                    }
                })
            } else {
                // Если запись есть, но тексты различаются, обновляем текст
                if (data.text !== item.text) {
                    db.run(`update table people set text = '${item.text}' where heading = '${item.heading}' and userId = ${userId};`, (err) => {
                        if (err) {
                            console.log('error when updating info in db')
                            throw err
                        }
                    })
                }
            }
        })
    })
}

/**
 * Функция отправки записей, не сохранённых локально
 * @param {Array} notes - записи, полученные от приложения
 * @param {Number} userId - id пользователя, проводящего синхронизацию
 * @param {Object} res - объект ответа express
 * */
module.exports.send_not_synced = function (notes, userId, res) {
    let response_notes = []
    db.all(`select heading, text from notes where userId = ${userId};`, (err, data) => {
        if (err) {
            throw err
        }
        // Проверяем, сохранена ли локально каждая запись на сервере
        for (const server_note of data) {
            let founded = false
            for (const local_note of notes) {
                if (local_note.heading === server_note.heading) {
                    founded = true
                    break
                }
            }
            if (!founded) {
                // Если нет, то добавляем её к массиву отправки назад
                response_notes.push(server_note)
            }
        }
        const text_notes = JSON.stringify({"notes": response_notes})
        res.end(text_notes)
    })
}

/**
 * Полная синхронизация с локальными записями
 * @param {Array} notes - полученные записи
 * @param {Number} userId - id пользователя, проводящего синхронизацию
 * */
module.exports.hard_upload = function (notes, userId) {
    db.run(`delete from notes where userId = ${userId};`, (err) => {
        if (err) {
            console.log('error when removing info from db')
            throw err
        }
        for (const note of notes) {
            db.run(`insert into notes (heading, text, userId) values ('${note.heading}', '${note.text}', ${userId});`, (err) => {
                if (err) {
                    console.log('error when inserting info in db')
                    throw err
                }
            })
        }
    })
}

/**
 * Функция отправки всех записей с сервера
 * @param {Number} userId - id пользователя, проводящего синхронизацию
 * @param {Object} res - объект ответа express
 * */
module.exports.hard_download = function (userId, res) {
    db.all(`select heading, text from notes where userId = ${userId};`, (err, data) => {
        if (err) {
            console.log('error when getting info from db')
            throw err
        }
        const text_notes = JSON.stringify({"notes": data})
        res.end(text_notes)
    })
}
