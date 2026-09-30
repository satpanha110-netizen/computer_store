import { ref } from 'vue'

const visible = ref(false)
const message = ref('')
let timer = null

function show(text = 'Added to cart') {
  message.value = text
  visible.value = true
  if (timer) clearTimeout(timer)
  timer = setTimeout(() => {
    visible.value = false
  }, 2600)
}

export function useToast() {
  return { visible, message, show }
}