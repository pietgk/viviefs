/**
 * Android Hermes `Intl.DateTimeFormat` cannot drive Effect DateTime zones:
 * `formatToParts` plus `Date#setUTC*` throws `RangeError: Date value out of
 * bounds`. Import this module from the Android entry only. FormatJS is MIT.
 */
import '@formatjs/intl-getcanonicallocales/polyfill'
import '@formatjs/intl-locale/polyfill'
import '@formatjs/intl-datetimeformat/polyfill-force'
import '@formatjs/intl-datetimeformat/locale-data/en'
import '@formatjs/intl-datetimeformat/add-all-tz'

export {}
