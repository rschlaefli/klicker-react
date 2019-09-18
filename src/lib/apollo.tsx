// https://github.com/zeit/next.js/blob/canary/examples/with-apollo/lib/with-apollo-client.js

import React, { useMemo } from 'react'
import Head from 'next/head'
import { ApolloProvider } from '@apollo/react-hooks'
import fetch from 'isomorphic-unfetch'
import getConfig from 'next/config'
import Router from 'next/router'

import { ApolloClient } from 'apollo-client'
import { BatchHttpLink } from 'apollo-link-batch-http'
import { onError } from 'apollo-link-error'
import { ApolloLink, split } from 'apollo-link'
import { WebSocketLink } from 'apollo-link-ws'
import { SubscriptionClient } from 'subscriptions-transport-ws'
import { InMemoryCache, IntrospectionFragmentMatcher } from 'apollo-cache-inmemory'
import { getMainDefinition } from 'apollo-utilities'

import introspectionQueryResultData from '../fragmentTypes.json'

const { publicRuntimeConfig, serverRuntimeConfig } = getConfig()

let apolloClient = null

/**
 * Creates and configures the ApolloClient
 * @param  {Object} [initialState={}]
 */
function createApolloClient(initialState = {}): any {
  const isBrowser = typeof window !== 'undefined'

  const fragmentMatcher = new IntrospectionFragmentMatcher({
    introspectionQueryResultData,
  })

  const cache = new InMemoryCache({
    addTypename: true,
    dataIdFromObject: (o): string => o.id,
    fragmentMatcher,
  }).restore(initialState || {})

  // initialize the basic http link for both SSR and client-side usage
  let httpLink: any = new BatchHttpLink({
    credentials: 'include', // Additional fetch() options like `credentials` or `headers`
    fetch: !isBrowser && fetch,
    uri: isBrowser
      ? publicRuntimeConfig.apiUrl
      : serverRuntimeConfig.apiUrlSSR || publicRuntimeConfig.apiUrl || 'http://localhost:4000/graphql',
  })

  // on the client, differentiate between websockets and http requests
  if (isBrowser) {
    // instantiate a basic subscription client
    const wsClient = new SubscriptionClient(publicRuntimeConfig.apiUrlWS || 'ws://localhost:4000/graphql', {
      reconnect: true,
    })

    // create a websocket link from the client
    const wsLink = new WebSocketLink(wsClient)

    // swap out the http link with a split based on operation type
    // use websocket link for subscriptions, http link for remainder
    httpLink = split(
      ({ query }) => {
        const { kind, operation }: any = getMainDefinition(query)
        return kind === 'OperationDefinition' && operation === 'subscription'
      },
      wsLink,
      httpLink
    )
  }

  const link = ApolloLink.from([
    /* withClientState({
      cache,
      resolvers: {
        // TODO: add useful resolvers for local state
      },
    }), */
    onError(({ graphQLErrors, networkError }) => {
      if (graphQLErrors) {
        // TODO: log errors to sentry?
        graphQLErrors.forEach(({ message, path, locations, extensions }) => {
          console.log(`[GraphQL error]: Message: ${message}, Location: ${locations}, Path: ${path}`)

          if (isBrowser && extensions.code === 'UNAUTHENTICATED') {
            Router.push('/user/login?expired=true')
          }
        })
      }

      if (networkError) {
        console.log(`[Network error]: ${networkError}`)
      }
    }),
    httpLink,
  ])

  // setup APQ if configured appropriately
  let persistedQueryLink
  if (publicRuntimeConfig.persistQueries) {
    const { createPersistedQueryLink } = require('apollo-link-persisted-queries')
    persistedQueryLink = createPersistedQueryLink({
      generateHash: ({ documentId }) => documentId,
    })
  }

  return new ApolloClient({
    cache,
    connectToDevTools: isBrowser,
    link: persistedQueryLink ? persistedQueryLink.concat(link) : link,
    ssrMode: !isBrowser, // Disables forceFetch on the server (so queries are only run once)
  })
}

/**
 * Always creates a new apollo client on the server
 * Creates or reuses apollo client in the browser.
 * @param  {Object} initialState
 */
function initApolloClient(initialState?: any): any {
  // Make sure to create a new client for every server-side request so that data
  // isn't shared between connections (which would be bad)
  if (typeof window === 'undefined') {
    return createApolloClient(initialState)
  }

  // Reuse client on the client-side
  if (!apolloClient) {
    apolloClient = createApolloClient(initialState)
  }

  return apolloClient
}

/**
 * Creates and provides the apolloContext
 * to a next.js PageTree. Use it by wrapping
 * your PageComponent via HOC pattern.
 * @param {Function|Class} PageComponent
 * @param {Object} [config]
 * @param {Boolean} [config.ssr=true]
 */
export function withApollo(PageComponent, { ssr = true } = {}): any {
  const WithApollo = ({ apolloClient, apolloState, ...pageProps }: any): any => {
    const client = useMemo(() => apolloClient || initApolloClient(apolloState), [])
    return (
      <ApolloProvider client={client}>
        <PageComponent {...pageProps} />
      </ApolloProvider>
    )
  }

  // Set the correct displayName in development
  if (process.env.NODE_ENV !== 'production') {
    const displayName = PageComponent.displayName || PageComponent.name || 'Component'

    if (displayName === 'App') {
      console.warn('This withApollo HOC only works with PageComponents.')
    }

    WithApollo.displayName = `withApollo(${displayName})`
  }

  if (ssr || PageComponent.getInitialProps) {
    WithApollo.getInitialProps = async ctx => {
      const { AppTree } = ctx

      // Initialize ApolloClient, add it to the ctx object so
      // we can use it in `PageComponent.getInitialProp`.
      const apolloClient = (ctx.apolloClient = initApolloClient())

      // Run wrapped getInitialProps methods
      let pageProps = {}
      if (PageComponent.getInitialProps) {
        pageProps = await PageComponent.getInitialProps(ctx)
      }

      // Only on the server:
      if (typeof window === 'undefined') {
        // When redirecting, the response is finished.
        // No point in continuing to render
        if (ctx.res && ctx.res.finished) {
          return pageProps
        }

        // Only if ssr is enabled
        if (ssr) {
          try {
            // Run all GraphQL queries
            const { getDataFromTree } = await import('@apollo/react-ssr')
            await getDataFromTree(
              <AppTree
                pageProps={{
                  ...pageProps,
                  apolloClient,
                }}
              />
            )
          } catch (error) {
            // Prevent Apollo Client GraphQL errors from crashing SSR.
            // Handle them in components via the data.error prop:
            // https://www.apollographql.com/docs/react/api/react-apollo.html#graphql-query-data-error
            console.error('Error while running `getDataFromTree`', error)
          }

          // getDataFromTree does not call componentWillUnmount
          // head side effect therefore need to be cleared manually
          Head.rewind()
        }
      }

      // Extract query data from the Apollo store
      const apolloState = apolloClient.cache.extract()

      return {
        ...pageProps,
        apolloState,
      }
    }
  }

  return WithApollo
}
