<template>
  <v-menu offset-y>
    <v-btn class="ma-0" flat slot="activator">
      {{this.$i18n.messages[this.$i18n.locale].name}}
      <v-icon right>mdi-chevron-down</v-icon>
    </v-btn>
    <v-list>
      <v-list-tile :key="locale" @click="$i18n.locale = locale"
        v-for="(language, locale) in this.$i18n.messages">
        <v-list-tile-title>{{language.name}}</v-list-tile-title>
      </v-list-tile>
    </v-list>
  </v-menu>
</template>
