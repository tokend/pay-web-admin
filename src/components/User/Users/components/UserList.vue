<template>
  <div class="user-list">
    <template v-if="view.mode === VIEW_MODES_VERBOSE.index">
      <div class="user-list__filters-wrp">
        <div class="app-list-filters-wrp">
          <div class="app-list-filters__row">
            <input-field class="app-list-filters__field" v-model.trim="filters.email" label="Email" />
            <input-field class="app-list-filters__field" v-model.trim="filters.address" label="Account ID" />
            <select-field
              class="app-list-filters__field"
              v-model="filters.state"
              label="State">
              <option :value="''"></option>
              <option
                v-for="(state, key) in USER_STATES_FILTERS"
                :key="`user-list-${key}`"
                :value="USER_STATES[key]">
                {{ USER_STATES_VERBOSE[state] }}
              </option>
            </select-field>
            <select-field
              class="app-list-filters__field"
              v-model="filters.type"
              label="Type">
              <option value=""></option>
              <option
                v-for="[key, value] in Object.entries(USER_TYPES)"
                :value="value"
                :key="`user-list-${key}`">
                {{ verbozify(USER_TYPES_STR[key]) }}
              </option>
            </select-field>
          </div>

          <div class="app-list-filters__row">
            <select-field
              class="app-list-filters__field"
              v-model="filters.country"
              label="Country">
              <option value=''></option>
              <option
                v-for="country in enums.countries"
                :value="country"
                :key="`user-list-${country}`">
                {{ country }}
              </option>
            </select-field>
            <input-field class="app-list-filters__field" v-model.trim="filters.first_name" label="First name" />
            <input-field class="app-list-filters__field" v-model.trim="filters.last_name" label="Last name" />
          </div>
        </div>
      </div>

      <div class="user-list__list-wrp">
        <div class="app-list">
          <template v-if="list.data && list.data.length">
            <div class="app-list__header">
            <span class="app-list__cell user-list__email-cell">
              Account Email
            </span>
              <span class="app-list__cell user-list__email-cell">
             Account state
            </span>
              <span class="app-list__cell app-list__cell--right">
              Account ID
            </span>
            </div>

            <button class="app-list__li" v-for="item in list.data" :key="item.id" @click="toggleViewMode(item.id)">
            <span class="app-list__cell app-list__cell--important user-list__email-cell" :title="item.email">
              {{ item.email }}
            </span>
              <account-state-getter class="app-list__cell" :accountId="item.id"/>
              <span class="app-list__cell app-list__cell--right" :title="item.id">
              {{ item.id }}
            </span>
            </button>
          </template>

          <template v-else>
            <div class="app-list__li-like">
              <template v-if="isLoading">
                <p>
                  Loading...
                </p>
              </template>

              <template v-else>
                <p>
                  Nothing here yet
                </p>
              </template>
            </div>
          </template>
        </div>

        <div class="app__more-btn-wrp">
          <button
            class="app__btn-secondary"
            v-if="!isListEnded && list.data"
            @click="onMoreClick">
            More
          </button>
        </div>
      </div>
    </template>

    <user-view
      v-if="view.mode === VIEW_MODES_VERBOSE.user"
      :id="view.userId"
      @back="toggleViewMode(null)"
    />

  </div>
</template>

<script>
import Vue from 'vue'
import api from '@/api'
import SelectField from '@comcom/fields/SelectField'
import InputField from '@comcom/fields/InputField'
import AccountStateGetter from '@comcom/getters/AccountStateGetter'
import UserView from '../Users.Show'
import _ from 'lodash'
import safeGet from 'lodash/get'
import { createTxtFile } from '@/utils/file_writer'
import { verbozify } from '@/utils/verbozify'
import { humanizeDate } from '@/utils/formatters/formatDate'
import {
  USER_STATES,
  USER_STATES_STR,
  USER_TYPES,
  USER_TYPES_STR,
  USER_STATES_FILTERS
} from '@/constants'

const WHOLE_GROUP = 'all'
const USER_STATES_VERBOSE = Object.freeze({
  [USER_STATES_STR.nil]: 'Not verified',
  [USER_STATES_STR.waitingForApproval]: 'Waiting for review',
  [USER_STATES_STR.approved]: 'Approved',
  [USER_STATES_STR.rejected]: 'Rejected',
  [USER_STATES_STR.notDefined]: 'Not defined'
})
const VIEW_MODES_VERBOSE = Object.freeze({
  index: 'index',
  user: 'user'
})
const EXPORT_FIELDS = {
  'state': {},
  'email': {},
  'first_name': {},
  'last_name': {},
  'id': {},
  'reject_reason': {},
  'line_1': {},
  'line_2': {},
  'city': {},
  'country': {},
  'address_state': {},
  'postal_code': {},
  'created_at': {
    formatter: humanizeDate
  }
}

export default {
  components: {
    UserView,
    InputField,
    SelectField,
    AccountStateGetter
  },
  data () {
    return {
      USER_STATES_VERBOSE,
      VIEW_MODES_VERBOSE,
      filters: {
        email: '',
        address: '',
        country: '',
        first_name: '',
        last_name: '',
        state: '',
        type: ''
      },
      view: {
        mode: VIEW_MODES_VERBOSE.index,
        userId: null,
        scrollPosition: 0
      },
      enums: {
        countries: []
      },
      list: {},
      isListEnded: false,
      isLoading: false,

      txtURL: '',
      USER_STATES,
      USER_STATES_STR,
      USER_TYPES_STR,
      USER_STATES_FILTERS,
      USER_TYPES,
      EXPORT_FIELDS
    }
  },
  created () {
    this.getList()
    this.getEnums()
  },
  methods: {
    verbozify,
    async getEnums () {
      this.enums = (await api.users.getEnums()).data
    },
    async getList () {
      this.txtURL = ''
      this.isLoading = true
      try {
        const filters = this.collectFilters()
        this.list = await api.users.getAll(filters)
        this.isListEnded = !(this.list.data || []).length
      } catch (error) {
        error.showMessage('Cannot load user list')
      }
      this.isLoading = false
    },
    async onMoreClick () {
      const oldLength = this.list.data.length
      try {
        this.list = await this.list.concatNext()
        this.isListEnded = oldLength === this.list.data.length
      } catch (error) {
        error.showMessage('Cannot load next page')
      }
    },
    async getFullList () {
      const filters = this.collectFilters()
      let response = await api.users.getAll(filters)
      let list = response._rawResponse.body.data
      let length = list.length
      while (1) {
        response = await response.next()
        list = list.concat(response._rawResponse.body.data)
        if (list.length === length) {
          break
        }
        length = list.length
      }
      return list.map(user => {
        return {
          ...(safeGet(user, 'relationships.kyc.data.attributes.value') ? unparceForm(user.relationships.kyc.data.attributes.value) : {}),
          ...(safeGet(user, 'relationships') ? user.relationships : {}),
          ...(safeGet(user, 'attributes') ? user.attributes : {}),
          ...user
        }
      })

      function unparceForm (form) {
        form = JSON.parse(form)
        if (form.v2) {
          form = form.v2
        }
        return {
          ...form,
          ...form.address,
          address_state: safeGet(form, 'address.state')
        }
      }
    },
    collectFilters () {
      const result = {}
      for (const key in this.filters) {
        if (this.filters.hasOwnProperty(key)) {
          const element = this.filters[key]
          if (element === WHOLE_GROUP) continue
          result[key] = element
        }
      }
      return result
    },

    toggleViewMode (id) {
      if (id) {
        this.view.mode = VIEW_MODES_VERBOSE.user
        this.view.userId = id
        this.view.scrollPosition = window.scrollY
        return
      }
      this.view.mode = VIEW_MODES_VERBOSE.index
      this.view.userId = null
      Vue.nextTick(() => {
        window.scroll(0, this.view.scrollPosition)
        this.view.scrollPosition = 0
      })
    },
    async generateFile () {
      const list = (await this.getFullList()).data
      this.txtURL = createTxtFile(this.usersListToCSV(list), 'text/csv;encoding:utf-8')
    },

    usersListToTxt (list) {
      return list.reduce((result, user) =>
        result + `\t\t${user.state}\t${user.id}\t${user.email}\t\t \r\n`,
        'Name\tLast Name\tState\tAccount id\t Email\t Country \r\n')
    },

    usersListToCSV (list) {
      return list.reduce((result, user) =>
        result + `,,${user.state},${user.id},${user.email},, \r\n`,
        'Name,Last Name,State,Account id, Email, Country \r\n')
    }
  },
  watch: {
    'filters.state' () { this.getList() },
    'filters.type' () { this.getList() },
    'filters.country' () { this.getList() },
    'filters.email': _.throttle(function () { this.getList() }, 1000),
    'filters.address': _.throttle(function () { this.getList() }, 1000),
    'filters.first_name': _.throttle(function () { this.getList() }, 1000),
    'filters.last_name': _.throttle(function () { this.getList() }, 1000)
  }
}
</script>

<style lang="scss" scoped>
  @import '../../../../assets/scss/_colors.scss';

  .user-list__filters-wrp {
    margin-bottom: 4rem;
  }

  .user-list__download-btn,
  .user-list__download-link {
    background: $color-content-bg;
    box-shadow: 0px 1px 5.6px 0.4px rgba(170, 170, 170, 0.72);
    display: inline-block;
    font-size: 1.6rem;
    padding: 5px 10px;
    margin-bottom: 10px;
    margin-right: 10px;
    color: $color-text;

    svg {
      height: 16px;
      margin-left: 5px;
      transform: translateY(4px);
      width: 16px;
    }
  }

</style>
