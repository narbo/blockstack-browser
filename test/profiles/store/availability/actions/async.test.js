import configureMockStore from 'redux-mock-store'
import thunk from 'redux-thunk'
import nock from 'nock'
import { AvailabilityActions } from '../../../../../app/js/profiles/store/availability'
import DEFAULT_API from '../../../../../app/js/account/store/settings/default'
import {
  NAME_AVAILABLE,
  NAME_UNAVAILABLE,
  CHECKING_NAME_AVAILABILITY,
  CHECKING_NAME_PRICE,
  NAME_PRICE,
  NAME_PRICE_ERROR,
  NAME_AVAILABILITY_ERROR
} from '../../../../../app/js/profiles/store/availability/types'

const middlewares = [thunk]
const mockStore = configureMockStore(middlewares)

describe('Availability Store: Async Actions', () => {
  afterEach(() => {
    nock.cleanAll()
  })

  describe('checkNameAvailabilityAndPrice', () => {
    it('indicates name is available and costs 0.02118707 btc', () => {
      // mock core
      nock('https://core.blockstack.org')
        .get('/v1/names/satoshi.id')
        .reply(404, {}, { 'Content-Type': 'application/json' })

      nock('https://core.blockstack.org')
        .get('/v1/prices/names/satoshi.id?single_sig=1')
        .reply(
          200,
          {
            name_price: {
              satoshis: 1600000,
              btc: 0.016
            },
            total_tx_fees: 518707,
            register_tx_fee: {
              satoshis: 158739,
              btc: 0.00158739
            },
            preorder_tx_fee: {
              satoshis: 163648,
              btc: 0.00163648
            },
            warnings: [],
            total_estimated_cost: {
              satoshis: 2118707,
              btc: 0.02118707
            },
            update_tx_fee: {
              satoshis: 196320,
              btc: 0.0019632
            }
          },
          { 'Content-Type': 'application/json' }
        )

      const store = mockStore({})

      const mockAPI = Object.assign({}, DEFAULT_API, {})

      return store
        .dispatch(
          AvailabilityActions.checkNameAvailabilityAndPrice(
            mockAPI,
            'satoshi.id'
          )
        )
        .then(() => {
          const expectedActions = [
            {
              type: CHECKING_NAME_AVAILABILITY,
              domainName: 'satoshi.id'
            },
            {
              type: NAME_AVAILABLE,
              domainName: 'satoshi.id'
            },
            {
              type: CHECKING_NAME_PRICE,
              domainName: 'satoshi.id'
            },
            {
              type: NAME_PRICE,
              domainName: 'satoshi.id',
              price: 0.02118707
            }
          ]
          assert.deepEqual(store.getActions(), expectedActions)
        })
    })

    it('indicates subdomain name is available and costs 0 btc', () => {
      // mock core
      nock('https://core.blockstack.org')
        .get('/v1/names/satoshi.foo.id')
        .reply(404, {}, { 'Content-Type': 'application/json' })

      const store = mockStore({})

      const mockAPI = Object.assign({}, DEFAULT_API, {})

      return store
        .dispatch(
          AvailabilityActions.checkNameAvailabilityAndPrice(
            mockAPI,
            'satoshi.foo.id'
          )
        )
        .then(() => {
          const expectedActions = [
            {
              type: CHECKING_NAME_AVAILABILITY,
              domainName: 'satoshi.foo.id'
            },
            {
              type: NAME_AVAILABLE,
              domainName: 'satoshi.foo.id'
            },
            {
              type: CHECKING_NAME_PRICE,
              domainName: 'satoshi.foo.id'
            },
            {
              type: NAME_PRICE,
              domainName: 'satoshi.foo.id',
              price: 0
            }
          ]
          assert.deepEqual(store.getActions(), expectedActions)
        })
    })

    it('indicates name is unavailable', () => {
      // mock core
      nock('https://core.blockstack.org')
        .get('/v1/names/satoshi.id')
        .reply(200, {}, { 'Content-Type': 'application/json' })

      const store = mockStore({})

      const mockAPI = Object.assign({}, DEFAULT_API, {})

      return store
        .dispatch(
          AvailabilityActions.checkNameAvailabilityAndPrice(
            mockAPI,
            'satoshi.id'
          )
        )
        .then(() => {
          const expectedActions = [
            {
              type: CHECKING_NAME_AVAILABILITY,
              domainName: 'satoshi.id'
            },
            {
              type: NAME_UNAVAILABLE,
              domainName: 'satoshi.id'
            }
          ]
          assert.deepEqual(store.getActions(), expectedActions)
        })
    })

    it('indicates name is available and error checking price', () => {
      // mock core
      nock('https://core.blockstack.org')
        .get('/v1/names/satoshi.id')
        .reply(404, {}, { 'Content-Type': 'application/json' })

      nock('https://core.blockstack.org')
        .get('/v1/prices/names/satoshi.id?single_sig=1')
        .reply(500, 'UTXO provider unavailable')

      const store = mockStore({})

      const mockAPI = Object.assign({}, DEFAULT_API, {})

      return store
        .dispatch(
          AvailabilityActions.checkNameAvailabilityAndPrice(
            mockAPI,
            'satoshi.id'
          )
        )
        .then(() => {
          const expectedActions = [
            {
              type: CHECKING_NAME_AVAILABILITY,
              domainName: 'satoshi.id'
            },
            {
              type: NAME_AVAILABLE,
              domainName: 'satoshi.id'
            },
            {
              type: CHECKING_NAME_PRICE,
              domainName: 'satoshi.id'
            },
            {
              type: NAME_PRICE_ERROR,
              domainName: 'satoshi.id',
              error: 'Error'
            }
          ]
          assert.deepEqual(store.getActions(), expectedActions)
        })
    })

    it('indicates error checking availability', () => {
      // mock core
      nock('https://core.blockstack.org')
        .get('/v1/names/satoshi.id')
        .reply(500, 'Broken', { 'Content-Type': 'application/json' })

      const store = mockStore({})

      const mockAPI = Object.assign({}, DEFAULT_API, {})

      return store
        .dispatch(
          AvailabilityActions.checkNameAvailabilityAndPrice(
            mockAPI,
            'satoshi.id'
          )
        )
        .then(() => {
          const expectedActions = [
            {
              type: CHECKING_NAME_AVAILABILITY,
              domainName: 'satoshi.id'
            },
            {
              type: NAME_AVAILABILITY_ERROR,
              domainName: 'satoshi.id',
              error: 'Error'
            }
          ]
          assert.deepEqual(store.getActions(), expectedActions)
        })
    })
  })
})
