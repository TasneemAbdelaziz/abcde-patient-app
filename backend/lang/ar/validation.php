<?php

/*
 | Arabic validation lines. Covers the rules used across the API; any rule not
 | listed here falls back to the English message automatically.
 */

return [
    'accepted' => 'يجب قبول :attribute.',
    'after' => 'يجب أن يكون :attribute تاريخاً بعد :date.',
    'before' => 'يجب أن يكون :attribute تاريخاً قبل :date.',
    'between' => [
        'array' => 'يجب أن يحتوي :attribute على عدد عناصر بين :min و :max.',
        'file' => 'يجب أن يكون حجم :attribute بين :min و :max كيلوبايت.',
        'numeric' => 'يجب أن تكون قيمة :attribute بين :min و :max.',
        'string' => 'يجب أن يكون طول :attribute بين :min و :max حرفاً.',
    ],
    'boolean' => 'يجب أن تكون قيمة :attribute إما صحيحة أو خاطئة.',
    'confirmed' => 'تأكيد :attribute غير متطابق.',
    'date' => 'يجب أن يكون :attribute تاريخاً صحيحاً.',
    'date_format' => 'يجب أن يطابق :attribute الصيغة :format.',
    'different' => 'يجب أن يكون :attribute و :other مختلفين.',
    'email' => 'يجب أن يكون :attribute عنوان بريد إلكتروني صحيحاً.',
    'exists' => 'القيمة المحددة لـ :attribute غير موجودة.',
    'file' => 'يجب أن يكون :attribute ملفاً.',
    'image' => 'يجب أن يكون :attribute صورة.',
    'in' => 'القيمة المحددة لـ :attribute غير صالحة.',
    'integer' => 'يجب أن يكون :attribute عدداً صحيحاً.',
    'max' => [
        'array' => 'يجب ألا يحتوي :attribute على أكثر من :max عنصراً.',
        'file' => 'يجب ألا يزيد حجم :attribute عن :max كيلوبايت.',
        'numeric' => 'يجب ألا تزيد قيمة :attribute عن :max.',
        'string' => 'يجب ألا يزيد طول :attribute عن :max حرفاً.',
    ],
    'mimes' => 'يجب أن يكون :attribute ملفاً من النوع: :values.',
    'min' => [
        'array' => 'يجب أن يحتوي :attribute على :min عنصراً على الأقل.',
        'file' => 'يجب أن يكون حجم :attribute :min كيلوبايت على الأقل.',
        'numeric' => 'يجب ألا تقل قيمة :attribute عن :min.',
        'string' => 'يجب أن يكون طول :attribute :min أحرف على الأقل.',
    ],
    'numeric' => 'يجب أن تكون قيمة :attribute رقماً.',
    'required' => 'حقل :attribute مطلوب.',
    'required_without' => 'حقل :attribute مطلوب عندما لا يوجد :values.',
    'string' => 'يجب أن يكون :attribute نصاً.',
    'unique' => 'قيمة :attribute مستخدمة من قبل.',
    'url' => 'يجب أن يكون :attribute رابطاً صحيحاً.',
    'array' => 'يجب أن يكون :attribute مصفوفة.',

    'attributes' => [
        'identifier' => 'معرّف الدخول',
        'password' => 'كلمة المرور',
        'full_name' => 'الاسم الكامل',
        'phone' => 'رقم الهاتف',
        'dept_code' => 'القسم',
        'patient_serial' => 'رقم المريض',
        'stars' => 'التقييم',
        'amount' => 'المبلغ',
        'complaint_text' => 'نص الشكوى',
    ],
];
