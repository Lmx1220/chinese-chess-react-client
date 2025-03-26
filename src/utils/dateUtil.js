import moment from 'moment'

export function dateDiffSeconds(startDate, endDate) {
  return moment(endDate).diff(moment(startDate), 'seconds')
}
export function strToDate(date) {
  return moment(date).toDate()
}
export function diffMilliseconds(startDate, endDate) {
  return moment(endDate).diff(moment(startDate), 'milliseconds')
}
