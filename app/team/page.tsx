"use client";
import { adminCore, auxCore, executiveCore } from "@/components/data"
import SpecialCard from "@/components/FacAd";
import MemberCard, { Member } from "@/components/MemberCard"
import { useState } from "react"





const CoreSection = ({
  title,
  members,
}: {
  title: string;
  members: Member[];
}) => {
  return (
    <>
      <div className="w-[80%] mt-20 flex flex-col items-center">
        <p className="text-4xl font-semibold text-primary">{title}</p>
      </div>

      <div className="mt-10 w-[80%] flex flex-wrap gap-8 justify-center">
        {members.map((member, index) => (
          <MemberCard
            key={index}
            name={member.name}
            sig={member.sig}
            post={member.post}
            image={member.image}
            linkedin={member.linkedin}
          />
        ))}
      </div>
    </>
  );
};


const Members = () => {

  const [tab, setTab] = useState<string>("admins");

  const handleTabChange = (tabValue: string) => {
    setTab(tabValue);
  }

  return (
    <div className="pt-22 w-full flex flex-col items-center">
        <div className="w-[80%] mt-10 flex flex-col items-center">
            <p className="text-4xl font-semibold text-primary">Faculty Advisor</p>
        </div>
        <div className="my-10 flex flex-wrap gap-8 justify-center">
          <SpecialCard
            name="Dr. Vaishakh Nair"
            department="Chemical Engineering"
            role="Faculty Advisor"
            image="/fac_ad.jpeg"
            about="Dr. Vaishakh Nair is the Faculty Advisor for ISTE NITK and an Assistant Professor in the Department of Chemical Engineering at NITK Surathkal. His research focuses on lignin valorization, photocatalysis, and nanotechnology, with significant contributions to sustainable chemical processes. He has published over 25 research papers in high-impact journals, received more than 2,000 citations, and holds an h-index of 21. He has successfully supervised multiple funded research projects, delivered expert lectures at renowned institutions, and is widely recognized for his academic and research excellence."
            linkedin="https://www.linkedin.com/in/dr-vaishakh-nair-32a31a1b/?originalSubdomain=in"
            email="vaishakhnair@nitk.edu.in"
          />
        </div>

        {/* <div className="w-[80%] mt-10 flex flex-col items-center">
            <p className="text-4xl font-semibold ">Explorers</p>
        </div>
        <div className="flex w-[65%] justify-between mt-10 rounded-full border border-gray-900 px-2 py-1 shadow-md shadow-amber-50">
          <button id="admins" className={`w-full p-2 rounded-full hover:scale-110 transition-all ${tab === "admins" && "bg-gray-400/40"}`} onClick={() => handleTabChange("admins")}>Admins</button>
          <button id="catalyst" className={`w-full p-2 rounded-full hover:scale-110 transition-all ${tab === "catalyst" && "bg-gray-400/40"}`} onClick={() => handleTabChange("catalyst")}>Catalyst</button>
          <button id="charge" className={`w-full p-2 rounded-full hover:scale-110 transition-all ${tab === "charge" && "bg-gray-400/40"}`} onClick={() => handleTabChange("charge")}>Charge</button>
          <button id="chronicle" className={`w-full p-2 rounded-full hover:scale-110 transition-all ${tab === "chronicle" && "bg-gray-400/40"}`} onClick={() => handleTabChange("chronicle")}>Chronicle</button>
          <button id="clutch" className={`w-full p-2 rounded-full hover:scale-110 transition-all ${tab === "clutch" && "bg-gray-400/40"}`} onClick={() => handleTabChange("clutch")}>Clutch</button>
          <button id="concrete" className={`w-full p-2 rounded-full hover:scale-110 transition-all ${tab === "concrete" && "bg-gray-400/40"}`} onClick={() => handleTabChange("concrete")}>Concrete</button>
          <button id="create" className={`w-full p-2 rounded-full hover:scale-110 transition-all ${tab === "create" && "bg-gray-400/40"}`} onClick={() => handleTabChange("create")}>Create</button>
          <button id="credit" className={`w-full p-2 rounded-full hover:scale-110 transition-all ${tab === "credit" && "bg-gray-400/40"}`} onClick={() => handleTabChange("credit")}>Credit</button>
          <button id="crypt" className={`w-full p-2 rounded-full hover:scale-110 transition-all ${tab === "crypt" && "bg-gray-400/40"}`} onClick={() => handleTabChange("crypt")}>Crypt</button>
        </div>
        <div className="mt-20 w-[80%] flex flex-wrap gap-8 justify-center">
            {
              memberDetails.map((member: Member, index:number) => (
                <div key={index}>
                  <MemberCard name={member.name} sig={member.sig} post={member.post} image={member.image} linkedin={member.linkedin} />
                </div>
              ))
            }
        </div> */}

      <CoreSection title="Admin Core" members={adminCore} />
      <CoreSection title="Executive Core" members={executiveCore} />
      <CoreSection title="Auxiliary Core" members={auxCore} />
    </div>
  )
}


export default Members