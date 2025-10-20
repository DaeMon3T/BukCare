TRUNCATE TABLE
    addresses_address,
    addresses_citymunicipality,
    addresses_province,
    authentication_user,
    authentication_otpverification,
    authentication_user_groups,
    authentication_user_user_permissions,
    django_admin_log,
    django_content_type,
    django_migrations,
    django_session,
    auth_group,
    auth_group_permissions,
    auth_permission
RESTART IDENTITY CASCADE;
