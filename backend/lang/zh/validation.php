<?php

/*
 | Simplified Chinese validation lines. Covers the rules used across the API;
 | any rule not listed here falls back to the English message automatically.
 */

return [
    'accepted' => ':attribute 必须接受。',
    'after' => ':attribute 必须是 :date 之后的日期。',
    'before' => ':attribute 必须是 :date 之前的日期。',
    'between' => [
        'array' => ':attribute 必须包含 :min 到 :max 个元素。',
        'file' => ':attribute 的大小必须在 :min 到 :max KB 之间。',
        'numeric' => ':attribute 必须介于 :min 到 :max 之间。',
        'string' => ':attribute 的长度必须在 :min 到 :max 个字符之间。',
    ],
    'boolean' => ':attribute 必须为 true 或 false。',
    'confirmed' => ':attribute 的确认不一致。',
    'date' => ':attribute 必须是有效的日期。',
    'date_format' => ':attribute 必须符合 :format 格式。',
    'different' => ':attribute 与 :other 必须不同。',
    'email' => ':attribute 必须是有效的电子邮件地址。',
    'exists' => '所选的 :attribute 无效。',
    'file' => ':attribute 必须是文件。',
    'image' => ':attribute 必须是图片。',
    'in' => '所选的 :attribute 无效。',
    'integer' => ':attribute 必须是整数。',
    'max' => [
        'array' => ':attribute 最多只能有 :max 个元素。',
        'file' => ':attribute 不能大于 :max KB。',
        'numeric' => ':attribute 不能大于 :max。',
        'string' => ':attribute 不能超过 :max 个字符。',
    ],
    'mimes' => ':attribute 必须是以下类型的文件：:values。',
    'min' => [
        'array' => ':attribute 至少要有 :min 个元素。',
        'file' => ':attribute 至少为 :min KB。',
        'numeric' => ':attribute 不能小于 :min。',
        'string' => ':attribute 至少为 :min 个字符。',
    ],
    'numeric' => ':attribute 必须是数字。',
    'required' => ':attribute 为必填项。',
    'required_without' => '当 :values 不存在时，:attribute 为必填项。',
    'string' => ':attribute 必须是字符串。',
    'unique' => ':attribute 已被占用。',
    'url' => ':attribute 必须是有效的网址。',
    'array' => ':attribute 必须是数组。',

    'attributes' => [
        'identifier' => '登录标识',
        'password' => '密码',
        'full_name' => '全名',
        'phone' => '电话号码',
        'dept_code' => '科室',
        'patient_serial' => '患者编号',
        'stars' => '评分',
        'amount' => '金额',
        'complaint_text' => '投诉内容',
    ],
];
