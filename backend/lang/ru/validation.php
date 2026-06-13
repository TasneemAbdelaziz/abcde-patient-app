<?php

/*
 | Russian validation lines. Covers the rules used across the API; any rule not
 | listed here falls back to the English message automatically.
 */

return [
    'accepted' => 'Необходимо принять :attribute.',
    'after' => ':attribute должно быть датой после :date.',
    'before' => ':attribute должно быть датой до :date.',
    'between' => [
        'array' => ':attribute должно содержать от :min до :max элементов.',
        'file' => 'Размер :attribute должен быть от :min до :max КБ.',
        'numeric' => ':attribute должно быть от :min до :max.',
        'string' => 'Длина :attribute должна быть от :min до :max символов.',
    ],
    'boolean' => 'Поле :attribute должно быть true или false.',
    'confirmed' => 'Подтверждение :attribute не совпадает.',
    'date' => ':attribute должно быть корректной датой.',
    'date_format' => ':attribute должно соответствовать формату :format.',
    'different' => ':attribute и :other должны различаться.',
    'email' => ':attribute должно быть корректным адресом эл. почты.',
    'exists' => 'Выбранное значение :attribute не существует.',
    'file' => ':attribute должно быть файлом.',
    'image' => ':attribute должно быть изображением.',
    'in' => 'Выбранное значение :attribute недопустимо.',
    'integer' => ':attribute должно быть целым числом.',
    'max' => [
        'array' => ':attribute не может содержать более :max элементов.',
        'file' => 'Размер :attribute не может превышать :max КБ.',
        'numeric' => ':attribute не может быть больше :max.',
        'string' => 'Длина :attribute не может превышать :max символов.',
    ],
    'mimes' => ':attribute должно быть файлом типа: :values.',
    'min' => [
        'array' => ':attribute должно содержать не менее :min элементов.',
        'file' => 'Размер :attribute должен быть не менее :min КБ.',
        'numeric' => ':attribute должно быть не менее :min.',
        'string' => 'Длина :attribute должна быть не менее :min символов.',
    ],
    'numeric' => ':attribute должно быть числом.',
    'required' => 'Поле :attribute обязательно для заполнения.',
    'required_without' => 'Поле :attribute обязательно, когда отсутствует :values.',
    'string' => ':attribute должно быть строкой.',
    'unique' => 'Такое значение :attribute уже занято.',
    'url' => ':attribute должно быть корректной ссылкой.',
    'array' => ':attribute должно быть массивом.',

    'attributes' => [
        'identifier' => 'идентификатор входа',
        'password' => 'пароль',
        'full_name' => 'полное имя',
        'phone' => 'номер телефона',
        'dept_code' => 'отделение',
        'patient_serial' => 'номер пациента',
        'stars' => 'оценка',
        'amount' => 'сумма',
        'complaint_text' => 'текст жалобы',
    ],
];
