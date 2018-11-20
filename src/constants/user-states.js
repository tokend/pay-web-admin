export const USER_STATES = Object.freeze({
  notDefined: 0,
  nil: 1,
  waitingForApproval: 2,
  approved: 4,
  rejected: 8
})

export const USER_STATES_STR = Object.freeze({
  nil: 'nil',
  waitingForApproval: 'waiting_for_approval',
  approved: 'approved',
  rejected: 'rejected',
  notDefined: 'undefined'
})

export const USER_STATES_FILTERS = Object.freeze({
  nil: 'nil',
  waitingForApproval: 'waiting_for_approval',
  rejected: 'rejected'
})
