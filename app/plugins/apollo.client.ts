import { ApolloClient, InMemoryCache, createHttpLink, ApolloLink, split } from '@apollo/client/core'
import { GraphQLWsLink } from '@apollo/client/link/subscriptions'
import { getMainDefinition } from '@apollo/client/utilities'
import { createClient } from 'graphql-ws'
import { DefaultApolloClient } from '@vue/apollo-composable'

export default defineNuxtPlugin((nuxtApp) => {
  const config = useRuntimeConfig()

  const authLink = new ApolloLink((operation, forward) => {
    const auth = useAuthStore()
    const token = auth.session?.accessToken
    operation.setContext({
      headers: {
        authorization: token ? `Bearer ${token}` : '',
      },
    })
    return forward(operation)
  })

  const httpLink = createHttpLink({
    uri: `https://${config.public.nhostSubdomain}.hasura.${config.public.nhostRegion}.nhost.run/v1/graphql`,
  })

  const wsLink = new GraphQLWsLink(
    createClient({
      url: `wss://${config.public.nhostSubdomain}.hasura.${config.public.nhostRegion}.nhost.run/v1/graphql`,
      connectionParams: () => {
        const auth = useAuthStore()
        const token = auth.session?.accessToken
        return {
          headers: {
            authorization: token ? `Bearer ${token}` : '',
          },
        }
      },
    }),
  )

  const splitLink = split(
    ({ query }) => {
      const definition = getMainDefinition(query)
      return definition.kind === 'OperationDefinition' && definition.operation === 'subscription'
    },
    wsLink,
    authLink.concat(httpLink),
  )

  const apolloClient = new ApolloClient({
    link: splitLink,
    cache: new InMemoryCache(),
  })

  nuxtApp.vueApp.provide(DefaultApolloClient, apolloClient)
})
