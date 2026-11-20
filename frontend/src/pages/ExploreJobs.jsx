import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { assets } from '../assets/assets'
import { toast } from 'react-toastify'

const jobOpenings = [
  {
    id: 'customer-support',
    title: 'Customer Support Associate',
    department: 'Patient Experience',
    location: 'Remote, India',
    type: 'Full-time',
    experience: '1–3 years',
    description: 'Help patients get quick answers about appointments, accounts, and healthcare services.'
  },
  {
    id: 'healthcare-partnerships',
    title: 'Healthcare Partnerships Manager',
    department: 'Business Development',
    location: 'Bengaluru, India',
    type: 'Full-time',
    experience: '3–5 years',
    description: 'Build relationships with clinics and healthcare providers to expand access to Mediconnect.'
  },
  {
    id: 'frontend-engineer',
    title: 'Frontend Engineer',
    department: 'Engineering',
    location: 'Remote, India',
    type: 'Full-time',
    experience: '2–4 years',
    description: 'Create accessible, responsive patient experiences using React and modern web technologies.'
  },
  {
    id: 'qa-engineer',
    title: 'Quality Assurance Engineer',
    department: 'Engineering',
    location: 'Hybrid, Bengaluru',
    type: 'Full-time',
    experience: '1–3 years',
    description: 'Test appointment, payment, and patient workflows to keep every release dependable.'
  }
]

const initialForm = {
  name: '',
  email: '',
  phone: '',
  role: jobOpenings[0].id,
  portfolio: '',
  message: '',
  resume: null
}

const ExploreJobs = () => {
  const navigate = useNavigate()
  const [selectedRole, setSelectedRole] = useState(null)
  const [form, setForm] = useState(initialForm)

  const openApplication = (roleId) => {
    setSelectedRole(roleId)
    setForm({ ...initialForm, role: roleId })
  }

  const updateForm = (event) => {
    const { name, value, files } = event.target
    setForm((current) => ({ ...current, [name]: files ? files[0] : value }))
  }

  const submitApplication = (event) => {
    event.preventDefault()
    toast.success('Application received. Our careers team will review your profile.')
    setSelectedRole(null)
    setForm(initialForm)
  }

  return (
    <div className='pb-20'>
      <section className='my-10 overflow-hidden rounded-3xl bg-[#004C7F] text-white'>
        <div className='grid md:grid-cols-[1.15fr_0.85fr]'>
          <div className='relative z-10 px-6 py-12 sm:px-12 sm:py-16'>
            <p className='mb-4 text-sm font-semibold tracking-[0.22em] text-blue-200'>CAREERS AT MEDICONNECT</p>
            <h1 className='max-w-2xl text-4xl font-semibold leading-tight sm:text-5xl'>Build a healthier future with us.</h1>
            <p className='mt-5 max-w-xl text-base leading-7 text-blue-50/85'>Join a team making healthcare simpler for patients and providers. Explore open roles and apply in a few minutes.</p>
            <div className='mt-8 flex flex-wrap gap-3 text-sm'>
              <span className='rounded-full bg-white/10 px-4 py-2'>Remote-friendly</span>
              <span className='rounded-full bg-white/10 px-4 py-2'>Patient-first</span>
              <span className='rounded-full bg-white/10 px-4 py-2'>Growing team</span>
            </div>
          </div>
          <div className='relative hidden min-h-72 md:block'>
            <div className='absolute -right-16 -top-20 h-80 w-80 rounded-full border-[36px] border-white/10'></div>
            <img className='absolute bottom-0 right-0 max-h-80 w-4/5 rounded-tl-[5rem] object-cover' src={assets.about_image} alt='Mediconnect healthcare team' />
          </div>
        </div>
      </section>

      <div className='mb-8 flex flex-col justify-between gap-4 border-b border-gray-200 pb-6 sm:flex-row sm:items-end'>
        <div>
          <p className='text-sm font-semibold text-primary'>OPEN POSITIONS</p>
          <h2 className='mt-2 text-3xl font-semibold text-gray-800'>Find where you belong</h2>
        </div>
        <p className='max-w-md text-sm leading-6 text-gray-500'>We hire curious, practical people who care about improving the patient experience.</p>
      </div>

      <div className='grid gap-5 lg:grid-cols-[1fr_320px]'>
        <div className='space-y-4'>
          {jobOpenings.map((job) => (
            <article className='group rounded-2xl border border-gray-200 bg-white p-5 transition-all duration-300 hover:border-primary hover:shadow-lg sm:p-7' key={job.id}>
              <div className='flex flex-col justify-between gap-5 sm:flex-row sm:items-start'>
                <div className='max-w-2xl'>
                  <div className='mb-3 flex flex-wrap gap-2 text-xs'>
                    <span className='rounded-full bg-primary-light text-primary-dark'>{job.department}</span>
                    <span className='rounded-full bg-gray-100 px-3 py-1 text-gray-600'>{job.type}</span>
                  </div>
                  <h3 className='text-xl font-semibold text-gray-800'>{job.title}</h3>
                  <p className='mt-2 text-sm leading-6 text-gray-500'>{job.description}</p>
                  <div className='mt-4 flex flex-wrap gap-x-5 gap-y-2 text-xs text-gray-500'>
                    <span>{job.location}</span>
                    <span>{job.experience}</span>
                  </div>
                </div>
                <button className='shrink-0 rounded-full bg-primary px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-gray-700' onClick={() => openApplication(job.id)}>Apply now</button>
              </div>
            </article>
          ))}
        </div>

        <aside className='h-fit rounded-2xl bg-primary-light/70 p-6 lg:sticky lg:top-5'>
          <p className='text-sm font-semibold text-primary'>WHY MEDICONNECT</p>
          <h2 className='mt-3 text-2xl font-semibold text-gray-800'>Careers with purpose</h2>
          <p className='mt-4 text-sm leading-6 text-gray-600'>Every role helps someone access care with less stress. Bring your skills, curiosity, and care.</p>
          <div className='my-6 h-px bg-gray-300'></div>
          <p className='font-medium text-gray-700'>Questions about hiring?</p>
          <a className='mt-2 block text-sm text-primary hover:underline' href='mailto:careers@mediconnect.in'>careers@mediconnect.in</a>
          <button className='mt-6 text-sm font-medium text-gray-600 underline underline-offset-4 hover:text-primary' onClick={() => navigate('/contact')}>Contact our team</button>
        </aside>
      </div>

      {selectedRole && (
        <div className='fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4' role='dialog' aria-modal='true' aria-labelledby='application-title'>
          <form className='max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl sm:p-8' onSubmit={submitApplication}>
            <div className='mb-6 flex items-start justify-between gap-6'>
              <div>
                <p className='text-sm font-semibold text-primary'>JOB APPLICATION</p>
                <h2 className='mt-2 text-2xl font-semibold text-gray-800' id='application-title'>Apply to Mediconnect</h2>
              </div>
              <button className='text-2xl leading-none text-gray-400 hover:text-gray-700' onClick={() => setSelectedRole(null)} type='button' aria-label='Close application'>×</button>
            </div>

            <div className='grid gap-5 sm:grid-cols-2'>
              <label className='block text-sm text-gray-600'>Full name
                <input className='mt-2 w-full rounded-lg border border-gray-300 px-4 py-3 text-sm outline-none focus:border-primary' name='name' value={form.name} onChange={updateForm} required />
              </label>
              <label className='block text-sm text-gray-600'>Email address
                <input className='mt-2 w-full rounded-lg border border-gray-300 px-4 py-3 text-sm outline-none focus:border-primary' type='email' name='email' value={form.email} onChange={updateForm} required />
              </label>
              <label className='block text-sm text-gray-600'>Phone number
                <input className='mt-2 w-full rounded-lg border border-gray-300 px-4 py-3 text-sm outline-none focus:border-primary' type='tel' name='phone' value={form.phone} onChange={updateForm} required />
              </label>
              <label className='block text-sm text-gray-600'>Role
                <select className='mt-2 w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-sm outline-none focus:border-primary' name='role' value={form.role} onChange={updateForm}>
                  {jobOpenings.map((job) => <option value={job.id} key={job.id}>{job.title}</option>)}
                </select>
              </label>
            </div>
            <label className='mt-5 block text-sm text-gray-600'>Portfolio or LinkedIn
              <input className='mt-2 w-full rounded-lg border border-gray-300 px-4 py-3 text-sm outline-none focus:border-primary' type='url' name='portfolio' value={form.portfolio} onChange={updateForm} placeholder='https://' />
            </label>
            <label className='mt-5 block text-sm text-gray-600'>Why are you a good fit?
              <textarea className='mt-2 min-h-28 w-full resize-y rounded-lg border border-gray-300 px-4 py-3 text-sm outline-none focus:border-primary' name='message' value={form.message} onChange={updateForm} required></textarea>
            </label>
            <label className='mt-5 block text-sm text-gray-600'>Resume
              <input className='mt-2 w-full rounded-lg border border-dashed border-gray-300 px-4 py-3 text-sm file:mr-3 file:rounded-full file:border-0 file:bg-primary file:px-4 file:py-2 file:text-white' type='file' name='resume' accept='.pdf,.doc,.docx' onChange={updateForm} required />
            </label>
            <div className='mt-7 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end'>
              <button className='rounded-full border border-gray-300 px-6 py-3 text-sm font-medium text-gray-600 hover:bg-gray-50' type='button' onClick={() => setSelectedRole(null)}>Cancel</button>
              <button className='rounded-full bg-primary px-7 py-3 text-sm font-medium text-white hover:bg-gray-700' type='submit'>Submit application</button>
            </div>
          </form>
        </div>
      )}
    </div>
  )
}

export default ExploreJobs