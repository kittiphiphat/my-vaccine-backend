import type { Attribute, Schema } from '@strapi/strapi';

export interface AdminApiToken extends Schema.CollectionType {
  collectionName: 'strapi_api_tokens';
  info: {
    description: '';
    displayName: 'Api Token';
    name: 'Api Token';
    pluralName: 'api-tokens';
    singularName: 'api-token';
  };
  pluginOptions: {
    'content-manager': {
      visible: false;
    };
    'content-type-builder': {
      visible: false;
    };
  };
  attributes: {
    accessKey: Attribute.String &
      Attribute.Required &
      Attribute.SetMinMaxLength<{
        minLength: 1;
      }>;
    createdAt: Attribute.DateTime;
    createdBy: Attribute.Relation<
      'admin::api-token',
      'oneToOne',
      'admin::user'
    > &
      Attribute.Private;
    description: Attribute.String &
      Attribute.SetMinMaxLength<{
        minLength: 1;
      }> &
      Attribute.DefaultTo<''>;
    expiresAt: Attribute.DateTime;
    lastUsedAt: Attribute.DateTime;
    lifespan: Attribute.BigInteger;
    name: Attribute.String &
      Attribute.Required &
      Attribute.Unique &
      Attribute.SetMinMaxLength<{
        minLength: 1;
      }>;
    permissions: Attribute.Relation<
      'admin::api-token',
      'oneToMany',
      'admin::api-token-permission'
    >;
    type: Attribute.Enumeration<['read-only', 'full-access', 'custom']> &
      Attribute.Required &
      Attribute.DefaultTo<'read-only'>;
    updatedAt: Attribute.DateTime;
    updatedBy: Attribute.Relation<
      'admin::api-token',
      'oneToOne',
      'admin::user'
    > &
      Attribute.Private;
  };
}

export interface AdminApiTokenPermission extends Schema.CollectionType {
  collectionName: 'strapi_api_token_permissions';
  info: {
    description: '';
    displayName: 'API Token Permission';
    name: 'API Token Permission';
    pluralName: 'api-token-permissions';
    singularName: 'api-token-permission';
  };
  pluginOptions: {
    'content-manager': {
      visible: false;
    };
    'content-type-builder': {
      visible: false;
    };
  };
  attributes: {
    action: Attribute.String &
      Attribute.Required &
      Attribute.SetMinMaxLength<{
        minLength: 1;
      }>;
    createdAt: Attribute.DateTime;
    createdBy: Attribute.Relation<
      'admin::api-token-permission',
      'oneToOne',
      'admin::user'
    > &
      Attribute.Private;
    token: Attribute.Relation<
      'admin::api-token-permission',
      'manyToOne',
      'admin::api-token'
    >;
    updatedAt: Attribute.DateTime;
    updatedBy: Attribute.Relation<
      'admin::api-token-permission',
      'oneToOne',
      'admin::user'
    > &
      Attribute.Private;
  };
}

export interface AdminPermission extends Schema.CollectionType {
  collectionName: 'admin_permissions';
  info: {
    description: '';
    displayName: 'Permission';
    name: 'Permission';
    pluralName: 'permissions';
    singularName: 'permission';
  };
  pluginOptions: {
    'content-manager': {
      visible: false;
    };
    'content-type-builder': {
      visible: false;
    };
  };
  attributes: {
    action: Attribute.String &
      Attribute.Required &
      Attribute.SetMinMaxLength<{
        minLength: 1;
      }>;
    actionParameters: Attribute.JSON & Attribute.DefaultTo<{}>;
    conditions: Attribute.JSON & Attribute.DefaultTo<[]>;
    createdAt: Attribute.DateTime;
    createdBy: Attribute.Relation<
      'admin::permission',
      'oneToOne',
      'admin::user'
    > &
      Attribute.Private;
    properties: Attribute.JSON & Attribute.DefaultTo<{}>;
    role: Attribute.Relation<'admin::permission', 'manyToOne', 'admin::role'>;
    subject: Attribute.String &
      Attribute.SetMinMaxLength<{
        minLength: 1;
      }>;
    updatedAt: Attribute.DateTime;
    updatedBy: Attribute.Relation<
      'admin::permission',
      'oneToOne',
      'admin::user'
    > &
      Attribute.Private;
  };
}

export interface AdminRole extends Schema.CollectionType {
  collectionName: 'admin_roles';
  info: {
    description: '';
    displayName: 'Role';
    name: 'Role';
    pluralName: 'roles';
    singularName: 'role';
  };
  pluginOptions: {
    'content-manager': {
      visible: false;
    };
    'content-type-builder': {
      visible: false;
    };
  };
  attributes: {
    code: Attribute.String &
      Attribute.Required &
      Attribute.Unique &
      Attribute.SetMinMaxLength<{
        minLength: 1;
      }>;
    createdAt: Attribute.DateTime;
    createdBy: Attribute.Relation<'admin::role', 'oneToOne', 'admin::user'> &
      Attribute.Private;
    description: Attribute.String;
    name: Attribute.String &
      Attribute.Required &
      Attribute.Unique &
      Attribute.SetMinMaxLength<{
        minLength: 1;
      }>;
    permissions: Attribute.Relation<
      'admin::role',
      'oneToMany',
      'admin::permission'
    >;
    updatedAt: Attribute.DateTime;
    updatedBy: Attribute.Relation<'admin::role', 'oneToOne', 'admin::user'> &
      Attribute.Private;
    users: Attribute.Relation<'admin::role', 'manyToMany', 'admin::user'>;
  };
}

export interface AdminTransferToken extends Schema.CollectionType {
  collectionName: 'strapi_transfer_tokens';
  info: {
    description: '';
    displayName: 'Transfer Token';
    name: 'Transfer Token';
    pluralName: 'transfer-tokens';
    singularName: 'transfer-token';
  };
  pluginOptions: {
    'content-manager': {
      visible: false;
    };
    'content-type-builder': {
      visible: false;
    };
  };
  attributes: {
    accessKey: Attribute.String &
      Attribute.Required &
      Attribute.SetMinMaxLength<{
        minLength: 1;
      }>;
    createdAt: Attribute.DateTime;
    createdBy: Attribute.Relation<
      'admin::transfer-token',
      'oneToOne',
      'admin::user'
    > &
      Attribute.Private;
    description: Attribute.String &
      Attribute.SetMinMaxLength<{
        minLength: 1;
      }> &
      Attribute.DefaultTo<''>;
    expiresAt: Attribute.DateTime;
    lastUsedAt: Attribute.DateTime;
    lifespan: Attribute.BigInteger;
    name: Attribute.String &
      Attribute.Required &
      Attribute.Unique &
      Attribute.SetMinMaxLength<{
        minLength: 1;
      }>;
    permissions: Attribute.Relation<
      'admin::transfer-token',
      'oneToMany',
      'admin::transfer-token-permission'
    >;
    updatedAt: Attribute.DateTime;
    updatedBy: Attribute.Relation<
      'admin::transfer-token',
      'oneToOne',
      'admin::user'
    > &
      Attribute.Private;
  };
}

export interface AdminTransferTokenPermission extends Schema.CollectionType {
  collectionName: 'strapi_transfer_token_permissions';
  info: {
    description: '';
    displayName: 'Transfer Token Permission';
    name: 'Transfer Token Permission';
    pluralName: 'transfer-token-permissions';
    singularName: 'transfer-token-permission';
  };
  pluginOptions: {
    'content-manager': {
      visible: false;
    };
    'content-type-builder': {
      visible: false;
    };
  };
  attributes: {
    action: Attribute.String &
      Attribute.Required &
      Attribute.SetMinMaxLength<{
        minLength: 1;
      }>;
    createdAt: Attribute.DateTime;
    createdBy: Attribute.Relation<
      'admin::transfer-token-permission',
      'oneToOne',
      'admin::user'
    > &
      Attribute.Private;
    token: Attribute.Relation<
      'admin::transfer-token-permission',
      'manyToOne',
      'admin::transfer-token'
    >;
    updatedAt: Attribute.DateTime;
    updatedBy: Attribute.Relation<
      'admin::transfer-token-permission',
      'oneToOne',
      'admin::user'
    > &
      Attribute.Private;
  };
}

export interface AdminUser extends Schema.CollectionType {
  collectionName: 'admin_users';
  info: {
    description: '';
    displayName: 'User';
    name: 'User';
    pluralName: 'users';
    singularName: 'user';
  };
  pluginOptions: {
    'content-manager': {
      visible: false;
    };
    'content-type-builder': {
      visible: false;
    };
  };
  attributes: {
    blocked: Attribute.Boolean & Attribute.Private & Attribute.DefaultTo<false>;
    createdAt: Attribute.DateTime;
    createdBy: Attribute.Relation<'admin::user', 'oneToOne', 'admin::user'> &
      Attribute.Private;
    email: Attribute.Email &
      Attribute.Required &
      Attribute.Private &
      Attribute.Unique &
      Attribute.SetMinMaxLength<{
        minLength: 6;
      }>;
    firstname: Attribute.String &
      Attribute.SetMinMaxLength<{
        minLength: 1;
      }>;
    isActive: Attribute.Boolean &
      Attribute.Private &
      Attribute.DefaultTo<false>;
    lastname: Attribute.String &
      Attribute.SetMinMaxLength<{
        minLength: 1;
      }>;
    password: Attribute.Password &
      Attribute.Private &
      Attribute.SetMinMaxLength<{
        minLength: 6;
      }>;
    preferedLanguage: Attribute.String;
    registrationToken: Attribute.String & Attribute.Private;
    resetPasswordToken: Attribute.String & Attribute.Private;
    roles: Attribute.Relation<'admin::user', 'manyToMany', 'admin::role'> &
      Attribute.Private;
    updatedAt: Attribute.DateTime;
    updatedBy: Attribute.Relation<'admin::user', 'oneToOne', 'admin::user'> &
      Attribute.Private;
    username: Attribute.String;
  };
}

export interface ApiAdminLogAdminLog extends Schema.CollectionType {
  collectionName: 'admin_logs';
  info: {
    description: 'Logs for admin activities';
    displayName: 'Admin Log';
    pluralName: 'admin-logs';
    singularName: 'admin-log';
  };
  options: {
    draftAndPublish: false;
  };
  attributes: {
    action: Attribute.String & Attribute.Required;
    createdAt: Attribute.DateTime;
    createdBy: Attribute.Relation<
      'api::admin-log.admin-log',
      'oneToOne',
      'admin::user'
    > &
      Attribute.Private;
    details: Attribute.JSON;
    message: Attribute.Text & Attribute.Required;
    timestamp: Attribute.DateTime &
      Attribute.Required &
      Attribute.DefaultTo<{
        $dbFunction: 'now';
      }>;
    type: Attribute.String;
    updatedAt: Attribute.DateTime;
    updatedBy: Attribute.Relation<
      'api::admin-log.admin-log',
      'oneToOne',
      'admin::user'
    > &
      Attribute.Private;
    user: Attribute.Relation<
      'api::admin-log.admin-log',
      'manyToOne',
      'plugin::users-permissions.user'
    >;
  };
}

export interface ApiBookingSettingBookingSetting extends Schema.CollectionType {
  collectionName: 'booking_settings';
  info: {
    description: '';
    displayName: 'booking_setting';
    pluralName: 'booking-settings';
    singularName: 'booking-setting';
  };
  options: {
    draftAndPublish: true;
  };
  attributes: {
    advance_booking_days: Attribute.Integer & Attribute.Required;
    createdAt: Attribute.DateTime;
    createdBy: Attribute.Relation<
      'api::booking-setting.booking-setting',
      'oneToOne',
      'admin::user'
    > &
      Attribute.Private;
    is_enabled: Attribute.Boolean &
      Attribute.Required &
      Attribute.DefaultTo<true>;
    prevent_last_minute_minutes: Attribute.Integer & Attribute.Required;
    publishedAt: Attribute.DateTime;
    slotDurationMinutes: Attribute.Integer &
      Attribute.Required &
      Attribute.DefaultTo<30>;
    updatedAt: Attribute.DateTime;
    updatedBy: Attribute.Relation<
      'api::booking-setting.booking-setting',
      'oneToOne',
      'admin::user'
    > &
      Attribute.Private;
    vaccine: Attribute.Relation<
      'api::booking-setting.booking-setting',
      'manyToOne',
      'api::vaccine.vaccine'
    >;
  };
}

export interface ApiHospitelHospitel extends Schema.CollectionType {
  collectionName: 'hospitels';
  info: {
    description: '';
    displayName: 'hospitel';
    pluralName: 'hospitels';
    singularName: 'hospitel';
  };
  options: {
    draftAndPublish: true;
  };
  attributes: {
    createdAt: Attribute.DateTime;
    createdBy: Attribute.Relation<
      'api::hospitel.hospitel',
      'oneToOne',
      'admin::user'
    > &
      Attribute.Private;
    name: Attribute.String;
    phone: Attribute.String;
    publishedAt: Attribute.DateTime;
    subwarningtext: Attribute.String;
    updatedAt: Attribute.DateTime;
    updatedBy: Attribute.Relation<
      'api::hospitel.hospitel',
      'oneToOne',
      'admin::user'
    > &
      Attribute.Private;
    warningtext: Attribute.String;
    website: Attribute.String;
  };
}

export interface ApiPatientLogPatientLog extends Schema.CollectionType {
  collectionName: 'patient_logs';
  info: {
    description: 'Logs for patient activities';
    displayName: 'Patient Log';
    pluralName: 'patient-logs';
    singularName: 'patient-log';
  };
  options: {
    draftAndPublish: false;
  };
  attributes: {
    action: Attribute.String & Attribute.Required;
    createdAt: Attribute.DateTime;
    createdBy: Attribute.Relation<
      'api::patient-log.patient-log',
      'oneToOne',
      'admin::user'
    > &
      Attribute.Private;
    details: Attribute.JSON;
    message: Attribute.Text & Attribute.Required;
    timestamp: Attribute.DateTime &
      Attribute.Required &
      Attribute.DefaultTo<{
        $dbFunction: 'now';
      }>;
    type: Attribute.String;
    updatedAt: Attribute.DateTime;
    updatedBy: Attribute.Relation<
      'api::patient-log.patient-log',
      'oneToOne',
      'admin::user'
    > &
      Attribute.Private;
    user: Attribute.Relation<
      'api::patient-log.patient-log',
      'manyToOne',
      'plugin::users-permissions.user'
    >;
  };
}

export interface ApiPatientPatient extends Schema.CollectionType {
  collectionName: 'patients';
  info: {
    description: 'Patient information';
    displayName: 'Patient';
    pluralName: 'patients';
    singularName: 'patient';
  };
  options: {
    draftAndPublish: false;
  };
  attributes: {
    address: Attribute.String;
    age: Attribute.Integer;
    birth_date: Attribute.Date & Attribute.Required;
    createdAt: Attribute.DateTime;
    createdBy: Attribute.Relation<
      'api::patient.patient',
      'oneToOne',
      'admin::user'
    > &
      Attribute.Private;
    email: Attribute.String & Attribute.Required;
    first_name: Attribute.String & Attribute.Required;
    gender: Attribute.Enumeration<['male', 'female', 'other']>;
    is_verified: Attribute.Boolean;
    last_name: Attribute.String & Attribute.Required;
    phone: Attribute.String;
    status: Attribute.Enumeration<['confirmed', 'cancelled']> &
      Attribute.DefaultTo<'confirmed'>;
    updatedAt: Attribute.DateTime;
    updatedBy: Attribute.Relation<
      'api::patient.patient',
      'oneToOne',
      'admin::user'
    > &
      Attribute.Private;
    user: Attribute.Relation<
      'api::patient.patient',
      'oneToOne',
      'plugin::users-permissions.user'
    >;
    vaccine_bookings: Attribute.Relation<
      'api::patient.patient',
      'oneToMany',
      'api::vaccine-booking.vaccine-booking'
    >;
  };
}

export interface ApiVaccineBookingVaccineBooking extends Schema.CollectionType {
  collectionName: 'vaccine_bookings';
  info: {
    description: 'Vaccine booking details';
    displayName: 'Vaccine Booking';
    pluralName: 'vaccine-bookings';
    singularName: 'vaccine-booking';
  };
  options: {
    draftAndPublish: true;
  };
  attributes: {
    bookingDate: Attribute.Date;
    createdAt: Attribute.DateTime;
    createdBy: Attribute.Relation<
      'api::vaccine-booking.vaccine-booking',
      'oneToOne',
      'admin::user'
    > &
      Attribute.Private;
    endTime: Attribute.String;
    patient: Attribute.Relation<
      'api::vaccine-booking.vaccine-booking',
      'manyToOne',
      'api::patient.patient'
    >;
    publishedAt: Attribute.DateTime;
    startTime: Attribute.String;
    status: Attribute.Enumeration<['confirmed', 'cancelled']> &
      Attribute.DefaultTo<'confirmed'>;
    updatedAt: Attribute.DateTime;
    updatedBy: Attribute.Relation<
      'api::vaccine-booking.vaccine-booking',
      'oneToOne',
      'admin::user'
    > &
      Attribute.Private;
    users_permissions_user: Attribute.Relation<
      'api::vaccine-booking.vaccine-booking',
      'manyToOne',
      'plugin::users-permissions.user'
    >;
    vaccine: Attribute.Relation<
      'api::vaccine-booking.vaccine-booking',
      'manyToOne',
      'api::vaccine.vaccine'
    >;
    vaccine_time_slot: Attribute.Relation<
      'api::vaccine-booking.vaccine-booking',
      'manyToOne',
      'api::vaccine-time-slot.vaccine-time-slot'
    >;
  };
}

export interface ApiVaccineServiceDayVaccineServiceDay
  extends Schema.CollectionType {
  collectionName: 'vaccine_service_days';
  info: {
    description: '';
    displayName: 'vaccine-service-day';
    pluralName: 'vaccine-service-days';
    singularName: 'vaccine-service-day';
  };
  options: {
    draftAndPublish: true;
  };
  attributes: {
    createdAt: Attribute.DateTime;
    createdBy: Attribute.Relation<
      'api::vaccine-service-day.vaccine-service-day',
      'oneToOne',
      'admin::user'
    > &
      Attribute.Private;
    day_of_week: Attribute.JSON;
    publishedAt: Attribute.DateTime;
    updatedAt: Attribute.DateTime;
    updatedBy: Attribute.Relation<
      'api::vaccine-service-day.vaccine-service-day',
      'oneToOne',
      'admin::user'
    > &
      Attribute.Private;
    vaccine: Attribute.Relation<
      'api::vaccine-service-day.vaccine-service-day',
      'manyToOne',
      'api::vaccine.vaccine'
    >;
  };
}

export interface ApiVaccineTimeSlotVaccineTimeSlot
  extends Schema.CollectionType {
  collectionName: 'vaccine_time_slots';
  info: {
    description: 'Vaccine time slots available for booking';
    displayName: 'Vaccine Time Slot';
    pluralName: 'vaccine-time-slots';
    singularName: 'vaccine-time-slot';
  };
  options: {
    draftAndPublish: false;
  };
  attributes: {
    createdAt: Attribute.DateTime;
    createdBy: Attribute.Relation<
      'api::vaccine-time-slot.vaccine-time-slot',
      'oneToOne',
      'admin::user'
    > &
      Attribute.Private;
    endTime: Attribute.Time;
    is_enabled: Attribute.Boolean &
      Attribute.Required &
      Attribute.DefaultTo<true>;
    quota: Attribute.Integer;
    startTime: Attribute.Time;
    updatedAt: Attribute.DateTime;
    updatedBy: Attribute.Relation<
      'api::vaccine-time-slot.vaccine-time-slot',
      'oneToOne',
      'admin::user'
    > &
      Attribute.Private;
    vaccine: Attribute.Relation<
      'api::vaccine-time-slot.vaccine-time-slot',
      'manyToOne',
      'api::vaccine.vaccine'
    >;
    vaccine_bookings: Attribute.Relation<
      'api::vaccine-time-slot.vaccine-time-slot',
      'oneToMany',
      'api::vaccine-booking.vaccine-booking'
    >;
  };
}

export interface ApiVaccineVaccine extends Schema.CollectionType {
  collectionName: 'vaccines';
  info: {
    description: '';
    displayName: 'vaccine';
    pluralName: 'vaccines';
    singularName: 'vaccine';
  };
  options: {
    draftAndPublish: true;
  };
  attributes: {
    booked: Attribute.Integer & Attribute.Required & Attribute.DefaultTo<0>;
    bookingEndDate: Attribute.Date;
    booking_settings: Attribute.Relation<
      'api::vaccine.vaccine',
      'oneToMany',
      'api::booking-setting.booking-setting'
    >;
    bookingStartDate: Attribute.Date;
    createdAt: Attribute.DateTime;
    createdBy: Attribute.Relation<
      'api::vaccine.vaccine',
      'oneToOne',
      'admin::user'
    > &
      Attribute.Private;
    description: Attribute.RichText;
    gender: Attribute.Enumeration<['male', 'female', 'any']>;
    maxAge: Attribute.Integer;
    maxQuota: Attribute.Integer;
    minAge: Attribute.Integer;
    publishedAt: Attribute.DateTime;
    serviceEndTime: Attribute.Time;
    serviceStartTime: Attribute.Time;
    title: Attribute.String;
    updatedAt: Attribute.DateTime;
    updatedBy: Attribute.Relation<
      'api::vaccine.vaccine',
      'oneToOne',
      'admin::user'
    > &
      Attribute.Private;
    useTimeSlots: Attribute.Boolean;
    vaccine_bookings: Attribute.Relation<
      'api::vaccine.vaccine',
      'oneToMany',
      'api::vaccine-booking.vaccine-booking'
    >;
    vaccine_service_days: Attribute.Relation<
      'api::vaccine.vaccine',
      'oneToMany',
      'api::vaccine-service-day.vaccine-service-day'
    >;
    vaccine_time_slots: Attribute.Relation<
      'api::vaccine.vaccine',
      'oneToMany',
      'api::vaccine-time-slot.vaccine-time-slot'
    >;
  };
}

export interface PluginContentReleasesRelease extends Schema.CollectionType {
  collectionName: 'strapi_releases';
  info: {
    displayName: 'Release';
    pluralName: 'releases';
    singularName: 'release';
  };
  options: {
    draftAndPublish: false;
  };
  pluginOptions: {
    'content-manager': {
      visible: false;
    };
    'content-type-builder': {
      visible: false;
    };
  };
  attributes: {
    actions: Attribute.Relation<
      'plugin::content-releases.release',
      'oneToMany',
      'plugin::content-releases.release-action'
    >;
    createdAt: Attribute.DateTime;
    createdBy: Attribute.Relation<
      'plugin::content-releases.release',
      'oneToOne',
      'admin::user'
    > &
      Attribute.Private;
    name: Attribute.String & Attribute.Required;
    releasedAt: Attribute.DateTime;
    scheduledAt: Attribute.DateTime;
    status: Attribute.Enumeration<
      ['ready', 'blocked', 'failed', 'done', 'empty']
    > &
      Attribute.Required;
    timezone: Attribute.String;
    updatedAt: Attribute.DateTime;
    updatedBy: Attribute.Relation<
      'plugin::content-releases.release',
      'oneToOne',
      'admin::user'
    > &
      Attribute.Private;
  };
}

export interface PluginContentReleasesReleaseAction
  extends Schema.CollectionType {
  collectionName: 'strapi_release_actions';
  info: {
    displayName: 'Release Action';
    pluralName: 'release-actions';
    singularName: 'release-action';
  };
  options: {
    draftAndPublish: false;
  };
  pluginOptions: {
    'content-manager': {
      visible: false;
    };
    'content-type-builder': {
      visible: false;
    };
  };
  attributes: {
    contentType: Attribute.String & Attribute.Required;
    createdAt: Attribute.DateTime;
    createdBy: Attribute.Relation<
      'plugin::content-releases.release-action',
      'oneToOne',
      'admin::user'
    > &
      Attribute.Private;
    entry: Attribute.Relation<
      'plugin::content-releases.release-action',
      'morphToOne'
    >;
    isEntryValid: Attribute.Boolean;
    locale: Attribute.String;
    release: Attribute.Relation<
      'plugin::content-releases.release-action',
      'manyToOne',
      'plugin::content-releases.release'
    >;
    type: Attribute.Enumeration<['publish', 'unpublish']> & Attribute.Required;
    updatedAt: Attribute.DateTime;
    updatedBy: Attribute.Relation<
      'plugin::content-releases.release-action',
      'oneToOne',
      'admin::user'
    > &
      Attribute.Private;
  };
}

export interface PluginI18NLocale extends Schema.CollectionType {
  collectionName: 'i18n_locale';
  info: {
    collectionName: 'locales';
    description: '';
    displayName: 'Locale';
    pluralName: 'locales';
    singularName: 'locale';
  };
  options: {
    draftAndPublish: false;
  };
  pluginOptions: {
    'content-manager': {
      visible: false;
    };
    'content-type-builder': {
      visible: false;
    };
  };
  attributes: {
    code: Attribute.String & Attribute.Unique;
    createdAt: Attribute.DateTime;
    createdBy: Attribute.Relation<
      'plugin::i18n.locale',
      'oneToOne',
      'admin::user'
    > &
      Attribute.Private;
    name: Attribute.String &
      Attribute.SetMinMax<
        {
          max: 50;
          min: 1;
        },
        number
      >;
    updatedAt: Attribute.DateTime;
    updatedBy: Attribute.Relation<
      'plugin::i18n.locale',
      'oneToOne',
      'admin::user'
    > &
      Attribute.Private;
  };
}

export interface PluginUploadFile extends Schema.CollectionType {
  collectionName: 'files';
  info: {
    description: '';
    displayName: 'File';
    pluralName: 'files';
    singularName: 'file';
  };
  pluginOptions: {
    'content-manager': {
      visible: false;
    };
    'content-type-builder': {
      visible: false;
    };
  };
  attributes: {
    alternativeText: Attribute.String;
    caption: Attribute.String;
    createdAt: Attribute.DateTime;
    createdBy: Attribute.Relation<
      'plugin::upload.file',
      'oneToOne',
      'admin::user'
    > &
      Attribute.Private;
    ext: Attribute.String;
    folder: Attribute.Relation<
      'plugin::upload.file',
      'manyToOne',
      'plugin::upload.folder'
    > &
      Attribute.Private;
    folderPath: Attribute.String &
      Attribute.Required &
      Attribute.Private &
      Attribute.SetMinMax<
        {
          min: 1;
        },
        number
      >;
    formats: Attribute.JSON;
    hash: Attribute.String & Attribute.Required;
    height: Attribute.Integer;
    mime: Attribute.String & Attribute.Required;
    name: Attribute.String & Attribute.Required;
    previewUrl: Attribute.String;
    provider: Attribute.String & Attribute.Required;
    provider_metadata: Attribute.JSON;
    related: Attribute.Relation<'plugin::upload.file', 'morphToMany'>;
    size: Attribute.Decimal & Attribute.Required;
    updatedAt: Attribute.DateTime;
    updatedBy: Attribute.Relation<
      'plugin::upload.file',
      'oneToOne',
      'admin::user'
    > &
      Attribute.Private;
    url: Attribute.String & Attribute.Required;
    width: Attribute.Integer;
  };
}

export interface PluginUploadFolder extends Schema.CollectionType {
  collectionName: 'upload_folders';
  info: {
    displayName: 'Folder';
    pluralName: 'folders';
    singularName: 'folder';
  };
  pluginOptions: {
    'content-manager': {
      visible: false;
    };
    'content-type-builder': {
      visible: false;
    };
  };
  attributes: {
    children: Attribute.Relation<
      'plugin::upload.folder',
      'oneToMany',
      'plugin::upload.folder'
    >;
    createdAt: Attribute.DateTime;
    createdBy: Attribute.Relation<
      'plugin::upload.folder',
      'oneToOne',
      'admin::user'
    > &
      Attribute.Private;
    files: Attribute.Relation<
      'plugin::upload.folder',
      'oneToMany',
      'plugin::upload.file'
    >;
    name: Attribute.String &
      Attribute.Required &
      Attribute.SetMinMax<
        {
          min: 1;
        },
        number
      >;
    parent: Attribute.Relation<
      'plugin::upload.folder',
      'manyToOne',
      'plugin::upload.folder'
    >;
    path: Attribute.String &
      Attribute.Required &
      Attribute.SetMinMax<
        {
          min: 1;
        },
        number
      >;
    pathId: Attribute.Integer & Attribute.Required & Attribute.Unique;
    updatedAt: Attribute.DateTime;
    updatedBy: Attribute.Relation<
      'plugin::upload.folder',
      'oneToOne',
      'admin::user'
    > &
      Attribute.Private;
  };
}

export interface PluginUsersPermissionsPermission
  extends Schema.CollectionType {
  collectionName: 'up_permissions';
  info: {
    description: '';
    displayName: 'Permission';
    name: 'permission';
    pluralName: 'permissions';
    singularName: 'permission';
  };
  pluginOptions: {
    'content-manager': {
      visible: false;
    };
    'content-type-builder': {
      visible: false;
    };
  };
  attributes: {
    action: Attribute.String & Attribute.Required;
    createdAt: Attribute.DateTime;
    createdBy: Attribute.Relation<
      'plugin::users-permissions.permission',
      'oneToOne',
      'admin::user'
    > &
      Attribute.Private;
    role: Attribute.Relation<
      'plugin::users-permissions.permission',
      'manyToOne',
      'plugin::users-permissions.role'
    >;
    updatedAt: Attribute.DateTime;
    updatedBy: Attribute.Relation<
      'plugin::users-permissions.permission',
      'oneToOne',
      'admin::user'
    > &
      Attribute.Private;
  };
}

export interface PluginUsersPermissionsRole extends Schema.CollectionType {
  collectionName: 'up_roles';
  info: {
    description: '';
    displayName: 'Role';
    name: 'role';
    pluralName: 'roles';
    singularName: 'role';
  };
  pluginOptions: {
    'content-manager': {
      visible: false;
    };
    'content-type-builder': {
      visible: false;
    };
  };
  attributes: {
    createdAt: Attribute.DateTime;
    createdBy: Attribute.Relation<
      'plugin::users-permissions.role',
      'oneToOne',
      'admin::user'
    > &
      Attribute.Private;
    description: Attribute.String;
    name: Attribute.String &
      Attribute.Required &
      Attribute.SetMinMaxLength<{
        minLength: 3;
      }>;
    permissions: Attribute.Relation<
      'plugin::users-permissions.role',
      'oneToMany',
      'plugin::users-permissions.permission'
    >;
    type: Attribute.String & Attribute.Unique;
    updatedAt: Attribute.DateTime;
    updatedBy: Attribute.Relation<
      'plugin::users-permissions.role',
      'oneToOne',
      'admin::user'
    > &
      Attribute.Private;
    users: Attribute.Relation<
      'plugin::users-permissions.role',
      'oneToMany',
      'plugin::users-permissions.user'
    >;
  };
}

export interface PluginUsersPermissionsUser extends Schema.CollectionType {
  collectionName: 'up_users';
  info: {
    description: '';
    displayName: 'User';
    name: 'user';
    pluralName: 'users';
    singularName: 'user';
  };
  options: {
    draftAndPublish: false;
  };
  attributes: {
    admin_logs: Attribute.Relation<
      'plugin::users-permissions.user',
      'oneToMany',
      'api::admin-log.admin-log'
    >;
    blocked: Attribute.Boolean & Attribute.DefaultTo<false>;
    confirmationToken: Attribute.String & Attribute.Private;
    confirmed: Attribute.Boolean & Attribute.DefaultTo<false>;
    createdAt: Attribute.DateTime;
    createdBy: Attribute.Relation<
      'plugin::users-permissions.user',
      'oneToOne',
      'admin::user'
    > &
      Attribute.Private;
    email: Attribute.Email &
      Attribute.Required &
      Attribute.SetMinMaxLength<{
        minLength: 6;
      }>;
    password: Attribute.Password &
      Attribute.Private &
      Attribute.SetMinMaxLength<{
        minLength: 6;
      }>;
    patient: Attribute.Relation<
      'plugin::users-permissions.user',
      'oneToOne',
      'api::patient.patient'
    >;
    patient_logs: Attribute.Relation<
      'plugin::users-permissions.user',
      'oneToMany',
      'api::patient-log.patient-log'
    >;
    provider: Attribute.String;
    resetPasswordToken: Attribute.String & Attribute.Private;
    role: Attribute.Relation<
      'plugin::users-permissions.user',
      'manyToOne',
      'plugin::users-permissions.role'
    >;
    status: Attribute.Enumeration<['confirmed', 'cancelled']>;
    updatedAt: Attribute.DateTime;
    updatedBy: Attribute.Relation<
      'plugin::users-permissions.user',
      'oneToOne',
      'admin::user'
    > &
      Attribute.Private;
    username: Attribute.String &
      Attribute.Required &
      Attribute.Unique &
      Attribute.SetMinMaxLength<{
        minLength: 3;
      }>;
    vaccine_bookings: Attribute.Relation<
      'plugin::users-permissions.user',
      'oneToMany',
      'api::vaccine-booking.vaccine-booking'
    >;
  };
}

declare module '@strapi/types' {
  export module Shared {
    export interface ContentTypes {
      'admin::api-token': AdminApiToken;
      'admin::api-token-permission': AdminApiTokenPermission;
      'admin::permission': AdminPermission;
      'admin::role': AdminRole;
      'admin::transfer-token': AdminTransferToken;
      'admin::transfer-token-permission': AdminTransferTokenPermission;
      'admin::user': AdminUser;
      'api::admin-log.admin-log': ApiAdminLogAdminLog;
      'api::booking-setting.booking-setting': ApiBookingSettingBookingSetting;
      'api::hospitel.hospitel': ApiHospitelHospitel;
      'api::patient-log.patient-log': ApiPatientLogPatientLog;
      'api::patient.patient': ApiPatientPatient;
      'api::vaccine-booking.vaccine-booking': ApiVaccineBookingVaccineBooking;
      'api::vaccine-service-day.vaccine-service-day': ApiVaccineServiceDayVaccineServiceDay;
      'api::vaccine-time-slot.vaccine-time-slot': ApiVaccineTimeSlotVaccineTimeSlot;
      'api::vaccine.vaccine': ApiVaccineVaccine;
      'plugin::content-releases.release': PluginContentReleasesRelease;
      'plugin::content-releases.release-action': PluginContentReleasesReleaseAction;
      'plugin::i18n.locale': PluginI18NLocale;
      'plugin::upload.file': PluginUploadFile;
      'plugin::upload.folder': PluginUploadFolder;
      'plugin::users-permissions.permission': PluginUsersPermissionsPermission;
      'plugin::users-permissions.role': PluginUsersPermissionsRole;
      'plugin::users-permissions.user': PluginUsersPermissionsUser;
    }
  }
}
