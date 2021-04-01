function ask_for_remove() {
    let result = confirm('Вы действительно хотите удалить запись?')
    if (result === true) {
        let id = document.getElementById('id-input').value
        fetch('/drop-note', {
            method: 'POST',
            body: JSON.stringify({'id': id}),
            headers: {"Content-Type": "application/json"}
        }).then(response => {
            if (response.ok) {
                alert('Запись успешно удалена. Нажмите ок чтобы перейти на главную страницу.')
            } else {
                alert('Ошибка при удалении.')
            }
            document.location.replace('/')
        })
    }
}
