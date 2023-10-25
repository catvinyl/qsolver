# qsolver

# Example secrets.json

```
{
    "naurok": {
        "authtoken": "xxxxxxxxxxxxxxxxxxxxxxxxxx"
    }
}
```

# Отримання secrets.json

Треба виконати цей код:

prompt('', JSON.stringify({
    "naurok": {
        "authtoken": new URLSearchParams(document.cookie).get('PHPSESSID') || 'Ви не увійшли в аккаунт'
    }
}))

Потім скопіювати у secrets.json

Та запустити файл run