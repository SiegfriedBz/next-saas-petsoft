import ContentBlock from '@/components/ContentBlock'
import { PetDetailsSkeleton } from '@/components/PetDetailsSkeleton'
import { PetListSkeleton } from '@/components/PetListSkeleton'
import SearchFormSkeleton from '@/components/SearchFormSkeleton'

const DashboardContentSkeleton = () => {
  return (
    <div className='grid max-md:grid-cols-1 md:grid-cols-[16rem_1fr] md:space-x-4 md:min-h-[62svh]'>
      <section className='grid md:grid-rows-[2rem_1fr] max-md:space-y-2 md:space-y-4'>
        <SearchFormSkeleton />
        <ContentBlock>
          <PetListSkeleton />
        </ContentBlock>
      </section>
      <section className='max-md:min-h-[38svh] max-md:my-8 md:h-[calc(100%+1rem)]'>
        <ContentBlock>
          <PetDetailsSkeleton />
        </ContentBlock>
      </section>
    </div>
  )
}

export default DashboardContentSkeleton
