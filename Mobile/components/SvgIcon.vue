<template>
  <image 
    class="svg-icon" 
    :src="iconSrc" 
    :mode="mode"
    :style="iconStyle"
    @click="onClick"
  />
</template>

<script>
import { icons } from './icons.js'

export default {
  name: 'SvgIcon',
  props: {
    name: {
      type: String,
      required: true
    },
    size: {
      type: [Number, String],
      default: 24
    },
    mode: {
      type: String,
      default: 'aspectFit'
    }
  },
  computed: {
    iconSrc() {
      return icons[this.name] || ''
    },
    iconStyle() {
      const size = typeof this.size === 'number' ? `${this.size}rpx` : this.size
      return {
        width: size,
        height: size
      }
    }
  },
  methods: {
    onClick() {
      this.$emit('click')
    }
  }
}
</script>

<style lang="scss" scoped>
.svg-icon {
  display: inline-block;
}
</style>
