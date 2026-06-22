/* ============================================================
   A.B.C.D.E — Staff Dashboards · i18n.js
   Phrase-based 4-language engine (en · ar · ru · zh).

   Strategy: English text is the key. t(phrase) returns the
   translation for the active language (or the English phrase as a
   safe fallback). i18nApply(root) sweeps a rendered subtree and
   translates every text node / placeholder / title attribute whose
   trimmed text is a known phrase — so buttons, table headers and
   labels are localized without touching each render function.

   Arabic is the priority language (full RTL); Russian & Chinese
   cover the UI vocabulary, with English fallback for long-tail
   prose. Free-text clinical content from the API stays in its
   original language (per the backend contract).
   ============================================================ */

window.LANGS = [
  { code: 'en', name: 'English', native: 'English', dir: 'ltr' },
  { code: 'ar', name: 'Arabic', native: 'العربية', dir: 'rtl' },
  { code: 'ru', name: 'Russian', native: 'Русский', dir: 'ltr' },
  { code: 'zh', name: 'Chinese', native: '中文', dir: 'ltr' }
];

(function () {
  // phrase → { ar, ru, zh }
  var P = {
    /* ---- common / chrome ---- */
    'Sign in': { ar: 'تسجيل الدخول', ru: 'Войти', zh: '登录' },
    'Sign in to continue': { ar: 'سجّل الدخول للمتابعة', ru: 'Войдите, чтобы продолжить', zh: '登录以继续' },
    'Sign out': { ar: 'تسجيل الخروج', ru: 'Выйти', zh: '退出' },
    'Staff sign-in': { ar: 'دخول الطاقم', ru: 'Вход для персонала', zh: '员工登录' },
    'Staff sign in': { ar: 'دخول الطاقم', ru: 'Вход для персонала', zh: '员工登录' },
    'Sign in': { ar: 'تسجيل الدخول', ru: 'Войти', zh: '登录' },
    'Refresh': { ar: 'تحديث', ru: 'Обновить', zh: '刷新' },
    'Retry': { ar: 'إعادة المحاولة', ru: 'Повторить', zh: '重试' },
    'Cancel': { ar: 'إلغاء', ru: 'Отмена', zh: '取消' },
    'Save': { ar: 'حفظ', ru: 'Сохранить', zh: '保存' },
    'Close': { ar: 'إغلاق', ru: 'Закрыть', zh: '关闭' },
    'Done': { ar: 'تم', ru: 'Готово', zh: '完成' },
    'Add': { ar: 'إضافة', ru: 'Добавить', zh: '添加' },
    'Edit': { ar: 'تعديل', ru: 'Изменить', zh: '编辑' },
    'Print': { ar: 'طباعة', ru: 'Печать', zh: '打印' },
    'Loading…': { ar: 'جارٍ التحميل…', ru: 'Загрузка…', zh: '加载中…' },
    'Notifications': { ar: 'الإشعارات', ru: 'Уведомления', zh: '通知' },
    'No notifications': { ar: 'لا توجد إشعارات', ru: 'Нет уведомлений', zh: '暂无通知' },
    'Could not load this screen': { ar: 'تعذّر تحميل هذه الشاشة', ru: 'Не удалось загрузить экран', zh: '无法加载此页面' },
    'Menu': { ar: 'القائمة', ru: 'Меню', zh: '菜单' },
    'Dashboards': { ar: 'لوحات التحكم', ru: 'Панели', zh: '仪表板' },
    'Live data from the API': { ar: 'بيانات حيّة من الخادم', ru: 'Данные в реальном времени', zh: '来自接口的实时数据' },
    'Back to homepage': { ar: 'العودة للرئيسية', ru: 'На главную', zh: '返回主页' },
    'Choose your workspace': { ar: 'اختر مساحة عملك', ru: 'Выберите рабочее пространство', zh: '选择您的工作区' },
    'Email · phone · national ID': { ar: 'البريد · الهاتف · الرقم القومي', ru: 'Email · телефон · удостоверение', zh: '邮箱 · 电话 · 身份证号' },
    'Password': { ar: 'كلمة المرور', ru: 'Пароль', zh: '密码' },
    'or quick sign-in by role': { ar: 'أو دخول سريع حسب الدور', ru: 'или быстрый вход по роли', zh: '或按角色快速登录' },
    'Theme': { ar: 'المظهر', ru: 'Тема', zh: '主题' },
    'Language': { ar: 'اللغة', ru: 'Язык', zh: '语言' },
    'Search patients…': { ar: 'ابحث عن مريض…', ru: 'Поиск пациентов…', zh: '搜索患者…' },
    'Search…': { ar: 'بحث…', ru: 'Поиск…', zh: '搜索…' },
    'All': { ar: 'الكل', ru: 'Все', zh: '全部' },
    'No results': { ar: 'لا توجد نتائج', ru: 'Нет результатов', zh: '无结果' },

    /* ---- roles ---- */
    'Reception': { ar: 'الاستقبال', ru: 'Регистратура', zh: '接待' },
    'Nursing': { ar: 'التمريض', ru: 'Сестринское дело', zh: '护理' },
    'Doctor': { ar: 'الطبيب', ru: 'Врач', zh: '医生' },
    'Quality': { ar: 'الجودة', ru: 'Качество', zh: '质量' },
    'Administration': { ar: 'الإدارة', ru: 'Администрация', zh: '管理' },
    'Director': { ar: 'الإدارة العليا', ru: 'Директор', zh: '院长' },
    'Emergency': { ar: 'الطوارئ', ru: 'Неотложная помощь', zh: '急救' },
    'Family': { ar: 'العائلة', ru: 'Семья', zh: '家属' },
    'Patient': { ar: 'المريض', ru: 'Пациент', zh: '患者' },
    'Front desk': { ar: 'مكتب الاستقبال', ru: 'Стойка регистрации', zh: '前台' },
    'Companion': { ar: 'المرافق', ru: 'Сопровождающий', zh: '陪同人' },
    'Treating physician': { ar: 'الطبيب المعالج', ru: 'Лечащий врач', zh: '主治医生' },
    'Head Nurse': { ar: 'رئيسة التمريض', ru: 'Старшая медсестра', zh: '护士长' },
    'Hospital Director': { ar: 'مدير المستشفى', ru: 'Директор больницы', zh: '医院院长' },
    'Quality Manager': { ar: 'مدير الجودة', ru: 'Менеджер по качеству', zh: '质量经理' },
    'Emergency Coordinator': { ar: 'منسّق الطوارئ', ru: 'Координатор неотложной помощи', zh: '急救协调员' },
    'IT Admin & Director': { ar: 'مسؤول النظام والإدارة', ru: 'ИТ-админ и директор', zh: 'IT管理员与院长' },

    /* ---- nav ---- */
    'Patient queue': { ar: 'قائمة المرضى', ru: 'Очередь пациентов', zh: '患者队列' },
    'Appointments': { ar: 'المواعيد', ru: 'Записи', zh: '预约' },
    'Committee': { ar: 'اللجنة', ru: 'Комиссия', zh: '委员会' },
    'Billing': { ar: 'الحسابات', ru: 'Счета', zh: '账单' },
    'Ward overview': { ar: 'نظرة عامة على القسم', ru: 'Обзор отделения', zh: '病区概览' },
    'Triage': { ar: 'الفرز', ru: 'Сортировка', zh: '分诊' },
    'Record vitals': { ar: 'تسجيل العلامات الحيوية', ru: 'Запись показателей', zh: '记录生命体征' },
    'Medications (MAR)': { ar: 'سجل الأدوية', ru: 'Лекарства (MAR)', zh: '用药记录' },
    'Handover (SBAR)': { ar: 'التسليم (SBAR)', ru: 'Передача смены (SBAR)', zh: '交接班 (SBAR)' },
    'Risk & RSTP': { ar: 'الخطورة والنقل الآمن', ru: 'Риск и RSTP', zh: '风险与转运' },
    'My worklist': { ar: 'قائمة عملي', ru: 'Мой список', zh: '我的工作列表' },
    'Patient file': { ar: 'الملف الطبي', ru: 'Карта пациента', zh: '患者档案' },
    'Diagnosis': { ar: 'التشخيص', ru: 'Диагноз', zh: '诊断' },
    'Orders': { ar: 'الطلبات', ru: 'Назначения', zh: '医嘱' },
    'Results': { ar: 'النتائج', ru: 'Результаты', zh: '结果' },
    'Prescriptions': { ar: 'الوصفات', ru: 'Рецепты', zh: '处方' },
    'AI Console': { ar: 'مساعد الذكاء', ru: 'ИИ-консоль', zh: 'AI 控制台' },
    'Journey': { ar: 'الرحلة', ru: 'Маршрут', zh: '就诊流程' },
    'Quality overview': { ar: 'نظرة عامة على الجودة', ru: 'Обзор качества', zh: '质量概览' },
    'Stage feedback': { ar: 'تقييم المراحل', ru: 'Отзывы по этапам', zh: '阶段反馈' },
    'Complaints': { ar: 'الشكاوى', ru: 'Жалобы', zh: '投诉' },
    'Reports': { ar: 'التقارير', ru: 'Отчёты', zh: '报告' },
    'KPIs': { ar: 'المؤشرات', ru: 'KPI', zh: '关键指标' },
    'AI models': { ar: 'نماذج الذكاء', ru: 'ИИ-модели', zh: 'AI 模型' },
    'Users & roles': { ar: 'المستخدمون والصلاحيات', ru: 'Пользователи и роли', zh: '用户与角色' },
    'Permissions': { ar: 'الصلاحيات', ru: 'Разрешения', zh: '权限' },
    'Audit trail': { ar: 'سجل التدقيق', ru: 'Журнал аудита', zh: '审计日志' },
    'Integration': { ar: 'الربط', ru: 'Интеграция', zh: '集成' },
    'Content': { ar: 'المحتوى', ru: 'Контент', zh: '内容' },
    'Content management': { ar: 'إدارة المحتوى', ru: 'Управление контентом', zh: '内容管理' },
    'Education media': { ar: 'الوسائط التعليمية', ru: 'Учебные медиа', zh: '教育媒体' },
    'Departments': { ar: 'الأقسام', ru: 'Отделения', zh: '科室' },
    'Medications': { ar: 'الأدوية', ru: 'Лекарства', zh: '药物' },
    'Upload image/video': { ar: 'رفع صورة/فيديو', ru: 'Загрузить фото/видео', zh: '上传图片/视频' },
    'Live board': { ar: 'اللوحة الحية', ru: 'Живая панель', zh: '实时看板' },
    'Critical watch': { ar: 'الحالات الحرجة', ru: 'Критические', zh: '危重监控' },
    'Metrics': { ar: 'المقاييس', ru: 'Метрики', zh: '指标' },
    'Escalation rules': { ar: 'قواعد التصعيد', ru: 'Правила эскалации', zh: '升级规则' },
    'Status': { ar: 'الحالة', ru: 'Статус', zh: '状态' },
    'Updates': { ar: 'التحديثات', ru: 'Обновления', zh: '更新' },
    'Care team': { ar: 'فريق الرعاية', ru: 'Команда', zh: '护理团队' },
    'Learn': { ar: 'تعلّم', ru: 'Обучение', zh: '学习' },

    /* ---- journey stages ---- */
    'Arrival / Reception': { ar: 'الوصول / الاستقبال', ru: 'Прибытие / регистрация', zh: '到达 / 登记' },
    'Specialty / Diagnosis': { ar: 'التخصص / التشخيص', ru: 'Специалист / диагноз', zh: '专科 / 诊断' },
    'Cath prep (cold)': { ar: 'تحضير القسطرة', ru: 'Подготовка к катетеризации', zh: '导管术准备' },
    'Catheterization': { ar: 'القسطرة', ru: 'Катетеризация', zh: '导管术' },
    'Recovery / ICU': { ar: 'الإفاقة / العناية', ru: 'Восстановление / ОРИТ', zh: '恢复 / ICU' },
    'Ward': { ar: 'القسم الداخلي', ru: 'Палата', zh: '病房' },
    'Discharge': { ar: 'الخروج', ru: 'Выписка', zh: '出院' },
    'Home follow-up': { ar: 'المتابعة المنزلية', ru: 'Наблюдение на дому', zh: '居家随访' },

    /* ---- triage / insurance / arrival / status / sentiment ---- */
    'Cold': { ar: 'بارد', ru: 'Плановый', zh: '非急' },
    'Critical': { ar: 'حرج', ru: 'Критический', zh: '危重' },
    'Insured': { ar: 'مؤمَّن', ru: 'Застрахован', zh: '已参保' },
    'Employer-paid': { ar: 'على نفقة جهة العمل', ru: 'Оплата работодателем', zh: '雇主支付' },
    'Self-pay': { ar: 'دفع ذاتي', ru: 'Самооплата', zh: '自费' },
    'Unfunded': { ar: 'غير مموَّل', ru: 'Без финансирования', zh: '无资助' },
    'State-funded': { ar: 'تمويل حكومي', ru: 'Гос. финансирование', zh: '国家资助' },
    'Pension': { ar: 'معاش', ru: 'Пенсия', zh: '养老金' },
    'Student': { ar: 'طالب', ru: 'Студент', zh: '学生' },
    'Scheduled': { ar: 'مجدول', ru: 'Плановый', zh: '预约' },
    'Outpatient (cold)': { ar: 'عيادة خارجية', ru: 'Амбулаторно', zh: '门诊' },
    'Referral / transfer': { ar: 'تحويل', ru: 'Направление / перевод', zh: '转诊 / 转院' },
    'Positive': { ar: 'إيجابي', ru: 'Позитив', zh: '正面' },
    'Neutral': { ar: 'محايد', ru: 'Нейтрально', zh: '中性' },
    'Negative': { ar: 'سلبي', ru: 'Негатив', zh: '负面' },
    'High': { ar: 'مرتفع', ru: 'Высокий', zh: '高' },
    'Medium': { ar: 'متوسط', ru: 'Средний', zh: '中' },
    'Low': { ar: 'منخفض', ru: 'Низкий', zh: '低' },
    'Stable': { ar: 'مستقر', ru: 'Стабильно', zh: '稳定' },
    'Not scored': { ar: 'غير مقيَّم', ru: 'Не оценено', zh: '未评分' },
    'Open': { ar: 'مفتوحة', ru: 'Открыта', zh: '待处理' },
    'Responded': { ar: 'تم الرد', ru: 'Отвечено', zh: '已回复' },
    'Escalated': { ar: 'تم التصعيد', ru: 'Эскалировано', zh: '已升级' },
    'Closed': { ar: 'مغلقة', ru: 'Закрыта', zh: '已关闭' },
    'Pending': { ar: 'قيد الانتظار', ru: 'Ожидает', zh: '待定' },
    'Approved': { ar: 'مقبول', ru: 'Одобрено', zh: '已批准' },
    'Declined': { ar: 'مرفوض', ru: 'Отклонено', zh: '已拒绝' },
    'Active': { ar: 'نشط', ru: 'Активен', zh: '在用' },
    'Disabled': { ar: 'معطّل', ru: 'Отключён', zh: '已停用' },
    'Approve': { ar: 'قبول', ru: 'Одобрить', zh: '批准' },
    'Decline': { ar: 'رفض', ru: 'Отклонить', zh: '拒绝' },
    'Assign': { ar: 'إسناد', ru: 'Назначить', zh: '分配' },
    'In stock': { ar: 'متوفر', ru: 'В наличии', zh: '有库存' },
    'Out of stock': { ar: 'غير متوفر', ru: 'Нет в наличии', zh: '缺货' },

    /* ---- buttons / actions (common literals across modules) ---- */
    'New registration': { ar: 'تسجيل جديد', ru: 'Новая регистрация', zh: '新登记' },
    'Register & issue Serial': { ar: 'تسجيل وإصدار رقم تسلسلي', ru: 'Зарегистрировать и выдать номер', zh: '登记并发放编号' },
    'Cards': { ar: 'البطاقات', ru: 'Карты', zh: '卡片' },
    'Sign-in QR': { ar: 'رمز دخول QR', ru: 'QR для входа', zh: '登录二维码' },
    'Patient sign-in QR': { ar: 'رمز دخول المريض', ru: 'QR-код входа пациента', zh: '患者登录二维码' },
    'Admit / start visit': { ar: 'إدخال / بدء زيارة', ru: 'Госпитализировать / начать визит', zh: '入院 / 开始就诊' },
    'Financial file': { ar: 'الملف المالي', ru: 'Финансовый файл', zh: '费用清单' },
    'Payment': { ar: 'دفع', ru: 'Оплата', zh: '付款' },
    'Take payment': { ar: 'تحصيل دفعة', ru: 'Принять оплату', zh: '收款' },
    'Pay': { ar: 'دفع', ru: 'Оплатить', zh: '付款' },
    'Set triage & route': { ar: 'تحديد الفرز والتوجيه', ru: 'Сортировка и маршрут', zh: '分诊并路由' },
    'Save vitals': { ar: 'حفظ العلامات', ru: 'Сохранить показатели', zh: '保存体征' },
    'Give': { ar: 'إعطاء', ru: 'Выдать', zh: '给药' },
    'Refused': { ar: 'مرفوض', ru: 'Отказ', zh: '拒绝' },
    'Missed': { ar: 'فائت', ru: 'Пропущено', zh: '漏服' },
    'Recompute': { ar: 'إعادة الحساب', ru: 'Пересчитать', zh: '重新计算' },
    'Transport (RSTP)': { ar: 'النقل الآمن (RSTP)', ru: 'Транспорт (RSTP)', zh: '转运 (RSTP)' },
    'Safety checklist': { ar: 'قائمة السلامة', ru: 'Чек-лист безопасности', zh: '安全核查表' },
    'Record VTE assessment': { ar: 'تسجيل تقييم الجلطات', ru: 'Оценка ВТЭ', zh: '记录VTE评估' },
    'Add diagnosis': { ar: 'إضافة تشخيص', ru: 'Добавить диагноз', zh: '添加诊断' },
    'Place order': { ar: 'إضافة طلب', ru: 'Создать назначение', zh: '下达医嘱' },
    'File result': { ar: 'تسجيل نتيجة', ru: 'Внести результат', zh: '录入结果' },
    'New prescription': { ar: 'وصفة جديدة', ru: 'Новый рецепт', zh: '新处方' },
    'Send to pharmacy': { ar: 'إرسال للصيدلية', ru: 'Отправить в аптеку', zh: '发送至药房' },
    'Request consultation': { ar: 'طلب استشارة', ru: 'Запросить консультацию', zh: '请求会诊' },
    'Request consent': { ar: 'طلب موافقة', ru: 'Запросить согласие', zh: '请求知情同意' },
    'AI summary': { ar: 'ملخص بالذكاء الاصطناعي', ru: 'ИИ-сводка', zh: 'AI 摘要' },
    'Generate draft': { ar: 'توليد مسودة', ru: 'Создать черновик', zh: '生成草稿' },
    'Approve & save': { ar: 'اعتماد وحفظ', ru: 'Утвердить и сохранить', zh: '批准并保存' },
    'Cath type': { ar: 'نوع القسطرة', ru: 'Тип катетеризации', zh: '导管类型' },
    'Create care plan': { ar: 'إنشاء خطة رعاية', ru: 'Создать план ухода', zh: '创建护理计划' },
    'Edit care plan': { ar: 'تعديل خطة الرعاية', ru: 'Изменить план ухода', zh: '编辑护理计划' },
    'Create account': { ar: 'إنشاء حساب', ru: 'Создать аккаунт', zh: '创建账号' },
    'Role': { ar: 'الدور', ru: 'Роль', zh: '角色' },
    'Enable': { ar: 'تفعيل', ru: 'Включить', zh: '启用' },
    'Disable': { ar: 'تعطيل', ru: 'Отключить', zh: '停用' },
    'Respond': { ar: 'رد', ru: 'Ответить', zh: '回复' },
    'Escalate': { ar: 'تصعيد', ru: 'Эскалировать', zh: '升级' },
    'AI monthly summary': { ar: 'الملخص الشهري بالذكاء', ru: 'Ежемесячная ИИ-сводка', zh: 'AI 月度摘要' },
    'Code Blue': { ar: 'كود أزرق', ru: 'Код синий', zh: '蓝色警报' },
    'Trigger Code Blue': { ar: 'إطلاق كود أزرق', ru: 'Объявить код синий', zh: '触发蓝色警报' },
    'Answer & resolve': { ar: 'الرد والإنهاء', ru: 'Ответить и закрыть', zh: '响应并解决' },
    'No answer · next': { ar: 'لا رد · التالي', ru: 'Нет ответа · далее', zh: '无应答 · 下一个' },
    'Respond': { ar: 'استجابة', ru: 'Реагировать', zh: '响应' },
    'Emergency SOS': { ar: 'استغاثة طوارئ', ru: 'Экстренный SOS', zh: '紧急求救' },
    'Contact': { ar: 'تواصل', ru: 'Связаться', zh: '联系' },
    'Open': { ar: 'فتح', ru: 'Открыть', zh: '打开' },
    'Open record': { ar: 'فتح السجل', ru: 'Открыть запись', zh: '打开记录' },
    'Raise funding committee': { ar: 'رفع لجنة التمويل', ru: 'Созвать комиссию по финансированию', zh: '提请资助委员会' },
    'Schedule monthly report': { ar: 'جدولة التقرير الشهري', ru: 'Запланировать ежемесячный отчёт', zh: '安排月度报告' },

    /* ---- table headers (common) ---- */
    'Patient': { ar: 'المريض', ru: 'Пациент', zh: '患者' },
    'Serial': { ar: 'الرقم التسلسلي', ru: 'Номер', zh: '编号' },
    'Insurance': { ar: 'التأمين', ru: 'Страховка', zh: '保险' },
    'Stage': { ar: 'المرحلة', ru: 'Этап', zh: '阶段' },
    'Department': { ar: 'القسم', ru: 'Отделение', zh: '科室' },
    'Phone': { ar: 'الهاتف', ru: 'Телефон', zh: '电话' },
    'Pulse': { ar: 'النبض', ru: 'Пульс', zh: '脉搏' },
    'BP': { ar: 'ضغط الدم', ru: 'АД', zh: '血压' },
    'Risk': { ar: 'الخطورة', ru: 'Риск', zh: '风险' },
    'Score': { ar: 'الدرجة', ru: 'Балл', zh: '评分' },
    'Tool': { ar: 'الأداة', ru: 'Инструмент', zh: '工具' },
    'Medication': { ar: 'الدواء', ru: 'Лекарство', zh: '药物' },
    'Pharmacy': { ar: 'الصيدلية', ru: 'Аптека', zh: '药房' },
    'Record administration': { ar: 'تسجيل الإعطاء', ru: 'Зафиксировать приём', zh: '记录给药' },
    'Test': { ar: 'الفحص', ru: 'Анализ', zh: '检验' },
    'Result': { ar: 'النتيجة', ru: 'Результат', zh: '结果' },
    'Range': { ar: 'المعدل الطبيعي', ru: 'Норма', zh: '参考范围' },
    'Flag': { ar: 'مؤشر', ru: 'Флаг', zh: '标记' },
    'Order': { ar: 'الطلب', ru: 'Назначение', zh: '医嘱' },
    'ICD-10': { ar: 'ICD-10', ru: 'МКБ-10', zh: 'ICD-10' },
    'Type': { ar: 'النوع', ru: 'Тип', zh: '类型' },
    'Duration': { ar: 'المدة', ru: 'Длительность', zh: '疗程' },
    'Name': { ar: 'الاسم', ru: 'Имя', zh: '姓名' },
    'When': { ar: 'الوقت', ru: 'Когда', zh: '时间' },
    'Requester': { ar: 'مقدّم الطلب', ru: 'Заявитель', zh: '申请人' },
    'Ticket': { ar: 'رقم التذكرة', ru: 'Тикет', zh: '工单' },
    'Visit': { ar: 'الزيارة', ru: 'Визит', zh: '就诊' },
    'Complaint': { ar: 'الشكوى', ru: 'Жалоба', zh: '投诉' },
    'Routed to': { ar: 'موجَّهة إلى', ru: 'Направлено', zh: '转交至' },
    'Note': { ar: 'ملاحظة', ru: 'Примечание', zh: '备注' },
    'Sentiment': { ar: 'الانطباع', ru: 'Тональность', zh: '情感' },
    'Month': { ar: 'الشهر', ru: 'Месяц', zh: '月份' },
    'Capabilities': { ar: 'الصلاحيات', ru: 'Возможности', zh: '权限能力' },
    'Action': { ar: 'إجراء', ru: 'Действие', zh: '操作' },
    'Detail': { ar: 'التفاصيل', ru: 'Детали', zh: '详情' },
    'Target': { ar: 'الهدف', ru: 'Цель', zh: '目标' },
    'Actor': { ar: 'المنفّذ', ru: 'Исполнитель', zh: '操作者' },
    'Time': { ar: 'الوقت', ru: 'Время', zh: '时间' },

    /* ---- tile labels ---- */
    'Registered patients': { ar: 'المرضى المسجّلون', ru: 'Зарегистрированные пациенты', zh: '已登记患者' },
    'Open visits': { ar: 'الزيارات المفتوحة', ru: 'Открытые визиты', zh: '在院就诊' },
    'Appointment requests': { ar: 'طلبات المواعيد', ru: 'Запросы на запись', zh: '预约请求' },
    'Committee cases': { ar: 'حالات اللجنة', ru: 'Случаи комиссии', zh: '委员会病例' },
    'Patients on unit': { ar: 'المرضى في القسم', ru: 'Пациенты в отделении', zh: '病区患者' },
    'Early warnings': { ar: 'الإنذارات المبكرة', ru: 'Ранние предупреждения', zh: '早期预警' },
    'Awaiting triage': { ar: 'بانتظار الفرز', ru: 'Ожидают сортировки', zh: '待分诊' },
    'Cardiac cases': { ar: 'حالات القلب', ru: 'Кардиослучаи', zh: '心脏病例' },
    'My patients': { ar: 'مرضاي', ru: 'Мои пациенты', zh: '我的患者' },
    'Active cases': { ar: 'الحالات النشطة', ru: 'Активные случаи', zh: '活动病例' },
    'Average rating': { ar: 'متوسط التقييم', ru: 'Средняя оценка', zh: '平均评分' },
    'Open complaints': { ar: 'الشكاوى المفتوحة', ru: 'Открытые жалобы', zh: '待处理投诉' },
    'Negative feedback': { ar: 'تقييمات سلبية', ru: 'Негативные отзывы', zh: '负面反馈' },
    'Satisfaction': { ar: 'الرضا', ru: 'Удовлетворённость', zh: '满意度' },
    'Active alerts': { ar: 'التنبيهات النشطة', ru: 'Активные тревоги', zh: '活动警报' },
    'Real emergencies': { ar: 'طوارئ حقيقية', ru: 'Реальные ЧС', zh: '真实急救' },
    'Total events': { ar: 'إجمالي الأحداث', ru: 'Всего событий', zh: '事件总数' },
    'Avg response': { ar: 'متوسط الاستجابة', ru: 'Ср. отклик', zh: '平均响应' },
    'Care points': { ar: 'نقاط الرعاية', ru: 'Баллы заботы', zh: '关怀积分' },
    'Current status': { ar: 'الحالة الحالية', ru: 'Текущий статус', zh: '当前状态' },
    'Next medication': { ar: 'الدواء التالي', ru: 'Следующее лекарство', zh: '下次用药' },
    'Door-to-Balloon (avg)': { ar: 'متوسط الباب-للبالون', ru: 'Дверь-баллон (сред.)', zh: '门球时间(均)' },
    'Active staff': { ar: 'الطاقم النشط', ru: 'Активный персонал', zh: '在职员工' },

    /* ---- empty / states ---- */
    'No patients': { ar: 'لا يوجد مرضى', ru: 'Нет пациентов', zh: '暂无患者' },
    'No active visits': { ar: 'لا توجد زيارات نشطة', ru: 'Нет активных визитов', zh: '暂无在院就诊' },
    'No appointment requests': { ar: 'لا توجد طلبات مواعيد', ru: 'Нет запросов на запись', zh: '暂无预约请求' },
    'No complaints': { ar: 'لا توجد شكاوى', ru: 'Нет жалоб', zh: '暂无投诉' },
    'No feedback yet': { ar: 'لا توجد تقييمات بعد', ru: 'Пока нет отзывов', zh: '暂无反馈' },
    'No open visits': { ar: 'لا توجد زيارات مفتوحة', ru: 'Нет открытых визитов', zh: '暂无在院就诊' },
    'No active alerts — all clear': { ar: 'لا تنبيهات نشطة — كل شيء على ما يرام', ru: 'Нет активных тревог', zh: '无活动警报 — 一切正常' },
    'No active medications': { ar: 'لا توجد أدوية فعّالة', ru: 'Нет активных лекарств', zh: '无在用药物' },
    'No orders yet — place one above': { ar: 'لا توجد طلبات — أضف طلبًا بالأعلى', ru: 'Нет назначений', zh: '暂无医嘱' },
    'No lab results yet': { ar: 'لا توجد نتائج مختبر بعد', ru: 'Нет результатов анализов', zh: '暂无化验结果' },
    'No imaging reports': { ar: 'لا توجد تقارير أشعة', ru: 'Нет заключений визуализации', zh: '暂无影像报告' },
    'No prescriptions yet': { ar: 'لا توجد وصفات بعد', ru: 'Нет рецептов', zh: '暂无处方' },
    'No patient selected': { ar: 'لم يتم اختيار مريض', ru: 'Пациент не выбран', zh: '未选择患者' },
    'No updates yet': { ar: 'لا توجد تحديثات بعد', ru: 'Нет обновлений', zh: '暂无更新' },
    'No diagnoses recorded': { ar: 'لا توجد تشخيصات مسجّلة', ru: 'Диагнозы не записаны', zh: '暂无诊断记录' },

    /* ---- page heads (eyebrow / titles / subs) ---- */
    'Management dashboard': { ar: 'لوحة الإدارة', ru: 'Панель управления', zh: '管理仪表板' },
    'Quality overview': { ar: 'نظرة عامة على الجودة', ru: 'Обзор качества', zh: '质量概览' },
    'Live escalation board': { ar: 'لوحة التصعيد الحية', ru: 'Живая панель эскалации', zh: '实时升级看板' },
    'Patient journey': { ar: 'رحلة المريض', ru: 'Маршрут пациента', zh: '患者就诊流程' },
    'Records & medical file': { ar: 'السجلات والملف الطبي', ru: 'Записи и карта', zh: '病历档案' }
  };

  var STATE = window.STATE || (window.STATE = {});

  function interpolate(s, vars) {
    if (!vars) return s;
    return s.replace(/\{(\w+)\}/g, function (m, k) { return vars[k] != null ? vars[k] : m; });
  }

  window.t = function (phrase, vars) {
    if (phrase == null) return '';
    var lang = STATE.lang || 'en';
    if (lang === 'en') return interpolate(phrase, vars);
    var row = P[phrase];
    var out = (row && row[lang]) || phrase;
    return interpolate(out, vars);
  };
  window.tHas = function (phrase) { return !!P[phrase]; };

  /* translate a rendered subtree's text nodes + placeholder/title attrs */
  function lookup(text) {
    var lang = STATE.lang || 'en';
    if (lang === 'en') return null;
    var key = text.trim();
    if (!key) return null;
    var row = P[key];
    if (row && row[lang]) return text.replace(key, row[lang]);
    return null;
  }

  window.i18nApply = function (root) {
    if (!root || (STATE.lang || 'en') === 'en') return;
    // text nodes
    try {
      var walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, null, false);
      var nodes = [], n;
      while ((n = walker.nextNode())) nodes.push(n);
      nodes.forEach(function (node) {
        var p = node.parentNode;
        if (!p) return;
        var tag = p.nodeName;
        if (tag === 'SCRIPT' || tag === 'STYLE' || tag === 'TEXTAREA') return;
        var rep = lookup(node.nodeValue);
        if (rep != null) node.nodeValue = rep;
      });
    } catch (e) {}
    // attributes
    try {
      var els = root.querySelectorAll('[placeholder],[title]');
      for (var i = 0; i < els.length; i++) {
        ['placeholder', 'title'].forEach(function (a) {
          var v = els[i].getAttribute(a);
          if (!v) return;
          var rep = lookup(v);
          if (rep != null) els[i].setAttribute(a, rep);
        });
      }
    } catch (e) {}
  };

  /* the i18n dictionary is also exported for the chrome to read */
  window.I18N_PHRASES = P;
})();
