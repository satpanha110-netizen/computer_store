<script setup>
import { reactive, ref } from 'vue'

const form = reactive({
  name: '',
  email: '',
  subject: '',
  message: ''
})

const submitted = ref(false)
const submitting = ref(false)

function sendMessage() {
  submitting.value = true
  setTimeout(() => {
    submitting.value = false
    submitted.value = true
    form.name = ''
    form.email = ''
    form.subject = ''
    form.message = ''
  }, 600)
}
</script>

<template>
  <div>

    <div class="page-head">
      <div class="container">
        <h1>Contact Us</h1>
        <p>Questions, orders or expert advice — our team is ready to help.</p>
      </div>
    </div>

    <div class="section">
      <div class="container contact-grid">

        <!-- INFO -->
        <div class="contact-side">
          <div class="contact-card">
            <h3>Get in touch</h3>
            <p class="contact-intro">
              Reach us by phone, email or visit our store. We usually reply within
              one business day.
            </p>

            <div class="info-list">
              <div class="info-item">
                <span class="info-icon">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" /><circle cx="12" cy="10" r="3" /></svg>
                </span>
                <div>
                  <strong>Store Address</strong>
                  <p>123 Monivong Blvd, Phnom Penh, Cambodia</p>
                </div>
              </div>

              <div class="info-item">
                <span class="info-icon">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3 19.5 19.5 0 0 1-6-6 19.8 19.8 0 0 1-3-8.6A2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1 1 .4 2 .7 2.9a2 2 0 0 1-.5 2.1L8 10a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.5c.9.3 1.9.6 2.9.7a2 2 0 0 1 1.7 2z" /></svg>
                </span>
                <div>
                  <strong>Phone</strong>
                  <p>+855 12 345 678</p>
                </div>
              </div>

              <div class="info-item">
                <span class="info-icon">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" /><polyline points="22,6 12,13 2,6" /></svg>
                </span>
                <div>
                  <strong>Email</strong>
                  <p>support@techstore.com</p>
                </div>
              </div>

              <div class="info-item">
                <span class="info-icon">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9" /><polyline points="12 7 12 12 15 14" /></svg>
                </span>
                <div>
                  <strong>Opening Hours</strong>
                  <p>Mon – Sat: 8:00 AM – 8:00 PM<br>Sunday: 9:00 AM – 6:00 PM</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- FORM -->
        <div class="contact-form-wrap">
          <div class="contact-card form-card">
            <h3>Send us a message</h3>
            <p class="contact-intro">
              Fill in the form and our team will get back to you shortly.
            </p>

            <form class="contact-form" @submit.prevent="sendMessage">

              <div class="form-row">
                <div class="form-group">
                  <label class="form-label" for="name">Name</label>
                  <input
                    id="name"
                    v-model="form.name"
                    class="form-control"
                    type="text"
                    placeholder="Your full name"
                    autocomplete="name"
                    required
                  />
                </div>

                <div class="form-group">
                  <label class="form-label" for="email">Email</label>
                  <input
                    id="email"
                    v-model="form.email"
                    class="form-control"
                    type="email"
                    placeholder="you@example.com"
                    autocomplete="email"
                    required
                  />
                </div>
              </div>

              <div class="form-group">
                <label class="form-label" for="subject">Subject</label>
                <input
                  id="subject"
                  v-model="form.subject"
                  class="form-control"
                  type="text"
                  placeholder="How can we help?"
                  required
                />
              </div>

              <div class="form-group">
                <label class="form-label" for="message">Message</label>
                <textarea
                  id="message"
                  v-model="form.message"
                  class="form-control form-textarea"
                  rows="5"
                  placeholder="Write your message here..."
                  required
                ></textarea>
              </div>

              <button
                class="btn btn-primary btn-lg btn-block"
                type="submit"
                :disabled="submitting"
              >
                <span v-if="submitting">Sending...</span>
                <span v-else class="form-send">
                  Send Message
                  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="22" y1="2" x2="11" y2="13" /><polygon points="22 2 15 22 11 13 2 9 22 2" /></svg>
                </span>
              </button>

              <Transition name="navpop">
                <div v-if="submitted" class="form-success">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
                  Thank you! Your message has been sent. We'll reply soon.
                </div>
              </Transition>

            </form>
          </div>
        </div>

      </div>
    </div>

  </div>
</template>