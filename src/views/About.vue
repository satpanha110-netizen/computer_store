<script setup>
const missionPoints = [
  {
    title: 'Our Mission',
    text: 'To make quality computing technology accessible, affordable and reliable for students, professionals, gamers and businesses across Cambodia.',
    icon: 'target'
  },
  {
    title: 'Our Vision',
    text: 'To be the region\u2019s most trusted computer destination — where expert advice and genuine products create lasting customer confidence.',
    icon: 'eye'
  }
]

const values = [
  {
    title: 'Quality First',
    text: 'We only stock genuine, tested products from leading brands.',
    icon: 'shield'
  },
  {
    title: 'Honest Pricing',
    text: 'Clear, competitive prices with honest discounts — no hidden surprises.',
    icon: 'tag'
  },
  {
    title: 'Expert Support',
    text: 'Our team helps you choose the right device for your real needs.',
    icon: 'users'
  },
  {
    title: 'Fast, Local',
    text: 'Quick delivery in Phnom Penh and nationwide, with local support.',
    icon: 'truck'
  }
]

const features = [
  {
    title: 'Free Delivery',
    text: 'Free express delivery on all orders over $500.',
    icon: 'truck'
  },
  {
    title: 'Secure Payment',
    text: 'Encrypted, 100% secure payment at checkout.',
    icon: 'lock'
  },
  {
    title: 'Easy Returns',
    text: '30-day hassle-free return policy on every order.',
    icon: 'refresh'
  },
  {
    title: '24/7 Support',
    text: 'Real experts ready to help whenever you need us.',
    icon: 'headset'
  }
]
</script>

<template>
  <div>

    <div class="page-head">
      <div class="container">
        <h1>About TechStore</h1>
        <p>Your trusted destination for computers, laptops and technology.</p>
      </div>
    </div>

    <!-- ABOUT -->
    <section class="section">
      <div class="container about-grid">

        <div class="about-visual">
          <div class="about-visual-card">
            <svg width="42" height="42" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="3" width="20" height="14" rx="2" /><line x1="8" y1="21" x2="16" y2="21" /><line x1="12" y1="17" x2="12" y2="21" /></svg>
            <span>Since 2019</span>
            <strong>Serving Cambodia</strong>
          </div>
        </div>

        <div class="about-text">
          <span class="section-kicker">About TechStore</span>
          <h2 class="section-title">Technology That <span class="about-accent">Works For You</span></h2>
          <p>
            TechStore was founded in Phnom Penh with a simple goal: to give people
            access to quality computers and accessories at honest prices — backed by
            real product knowledge and genuine care.
          </p>
          <p>
            Today we help students, professionals, gamers and businesses find the right
            laptops, desktops, monitors and peripherals for their everyday needs. Every
            product is sourced from trusted brands and tested before it reaches our shelves.
          </p>

          <div class="about-stats">
            <div class="about-stat">
              <strong>500+</strong>
              <span>Products in stock</span>
            </div>
            <div class="about-stat">
              <strong>10K+</strong>
              <span>Happy customers</span>
            </div>
            <div class="about-stat">
              <strong>4.9★</strong>
              <span>Average rating</span>
            </div>
          </div>
        </div>

      </div>
    </section>

    <!-- MISSION -->
    <section class="section section-alt">
      <div class="container">
        <div class="section-head">
          <span class="section-kicker">What Drives Us</span>
          <h2 class="section-title">Our Mission & Vision</h2>
        </div>

        <div class="mission-grid">
          <div v-for="item in missionPoints" :key="item.title" class="mission-card">
            <div class="mission-icon">
              <svg v-if="item.icon === 'target'" width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9" /><circle cx="12" cy="12" r="5" /><circle cx="12" cy="12" r="1" /></svg>
              <svg v-else width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" /></svg>
            </div>
            <h3>{{ item.title }}</h3>
            <p>{{ item.text }}</p>
          </div>
        </div>
      </div>
    </section>

    <!-- VALUES / WHY CHOOSE US -->
    <section class="section">
      <div class="container">
        <div class="section-head">
          <span class="section-kicker">Our Values</span>
          <h2 class="section-title">Why Choose TechStore</h2>
          <p class="section-sub">The principles that guide every device we sell and every customer we serve.</p>
        </div>

        <div class="features-grid">
          <div v-for="value in values" :key="value.title" class="feature-card">
            <span class="feature-icon">
              <svg v-if="value.icon === 'shield'" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /></svg>
              <svg v-else-if="value.icon === 'tag'" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z" /><line x1="7" y1="7" x2="7.01" y2="7" /></svg>
              <svg v-else-if="value.icon === 'users'" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" /></svg>
              <svg v-else width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="1" y="3" width="15" height="13" rx="2" /><polygon points="16 8 20 5 20 19 16 16" /><line x1="15" y1="3" x2="23" y2="3" /></svg>
            </span>
            <h3>{{ value.title }}</h3>
            <p>{{ value.text }}</p>
          </div>
        </div>
      </div>
    </section>

    <!-- CUSTOMER SERVICE / FEATURES -->
    <section class="section section-alt">
      <div class="container">
        <div class="section-head">
          <span class="section-kicker">Customer Service</span>
          <h2 class="section-title">Built Around You</h2>
          <p class="section-sub">Every purchase is protected by benefits designed to keep you happy long after the sale.</p>
        </div>

        <div class="features-grid">
          <div v-for="feature in features" :key="feature.title" class="feature-card">
            <span class="feature-icon">
              <svg v-if="feature.icon === 'truck'" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="1" y="3" width="15" height="13" rx="2" /><polygon points="16 8 20 5 20 19 16 16" /><line x1="15" y1="3" x2="23" y2="3" /></svg>
              <svg v-else-if="feature.icon === 'lock'" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></svg>
              <svg v-else-if="feature.icon === 'refresh'" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><polyline points="1 4 1 10 7 10" /><path d="M3.5 15a9 9 0 1 0 2-9.5L1 10" /></svg>
              <svg v-else width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M3 18v-6a9 9 0 0 1 18 0v6" /><path d="M21 19a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3zM3 19a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H3z" /></svg>
            </span>
            <h3>{{ feature.title }}</h3>
            <p>{{ feature.text }}</p>
          </div>
        </div>
      </div>
    </section>

    <!-- CTA -->
    <section class="section">
      <div class="container">
        <div class="cta-banner">
          <div>
            <h2>Experience the TechStore difference</h2>
            <p>Explore our catalog or reach out — we're here to help.</p>
          </div>
          <div class="cta-actions">
            <RouterLink to="/products" class="btn btn-white btn-lg">Shop Now</RouterLink>
            <RouterLink to="/contact" class="btn btn-ghost btn-lg">Contact Us</RouterLink>
          </div>
        </div>
      </div>
    </section>

  </div>
</template>