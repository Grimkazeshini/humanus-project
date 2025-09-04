const ADDR = {  
  TOKEN: "0x34A26837A888A535d0B2f0EeE6e6197f5aD8013D",  
  STAKING: "0xE54e488bA24aF609084018bB414C1D316d240711",  
  GOVERNANCE: "0xA56B2bFf99e10Bd0489A247D3E0cadc9D6ED67eB",  
  IDENTITY: "0xF75Bd0600fC6f84464AD4236848ae002EB40E413",  
  AIDEV: "0x3466F68Aae893455f75fC30F8686ac776A79F4A4"  
};

let provider, signer, user;

window.connectWallet = async function () {
  provider = new ethers.providers.Web3Provider(window.ethereum);
  await provider.send("eth_requestAccounts", []);
  signer = provider.getSigner();
  user = await signer.getAddress();
  document.getElementById("wallet").innerText = "Wallet: " + user;
  try {
    await updateAll();
  } catch (err) {
    alert("❌ Action failed: " + (err?.error?.message || err?.message || "Unknown error"));
    console.error(err);
  }
};

async function updateAll() {
  try { await loadBalance(); } catch (err) { console.error(err); }
  try { await loadProfile(); } catch (err) { console.error(err); }
  try { await loadTasks(); } catch (err) { console.error(err); }
  try { await loadProposals(); } catch (err) { console.error(err); }
  try { await loadStakeInfo(); } catch (err) { console.error(err); }
}

async function loadBalance() {
  const token = new ethers.Contract(ADDR.TOKEN, [
    "function balanceOf(address) view returns (uint256)",
    "function decimals() view returns (uint8)"
  ], provider);
  const raw = await token.balanceOf(user);
  const decimals = await token.decimals();
  document.getElementById("balance").innerText =
    "Balance: " + ethers.utils.formatUnits(raw, decimals) + " GOD";
}

window.createProfile = async function () {
  const handle = document.getElementById("handle").value;
  const uri = document.getElementById("uri").value;
  const contract = new ethers.Contract(ADDR.IDENTITY, [
    "function createProfile(string,string) public",
    "function profiles(address) view returns (string,string,bool)"
  ], signer);
  await contract.createProfile(handle, uri);
  alert("Profile created!");
  try {
    await loadProfile();
  } catch (err) { console.error(err); }
};

async function loadProfile() {
  const contract = new ethers.Contract(ADDR.IDENTITY, [
    "function profiles(address) view returns (string,string,bool)"
  ], provider);
  const [handle, uri, verified] = await contract.profiles(user);
  document.getElementById("identityView").innerHTML = `
    <p><strong>Handle:</strong> ${handle}</p>
    <p><strong>Metadata URI:</strong> ${uri}</p>
    <p><strong>Verified:</strong> ${verified ? "✅" : "❌"}</p>
  `;
};

window.postTask = async function () {
  const desc = document.getElementById("taskDesc").value;
  const bounty = document.getElementById("taskBounty").value;
  const bountyAmount = ethers.utils.parseUnits(bounty, 18);

  // Approve the AIDevInterface contract to spend the bounty tokens.
  const token = new ethers.Contract(ADDR.TOKEN, [
    "function approve(address,uint256) public returns (bool)"
  ], signer);
  const approveTx = await token.approve(ADDR.AIDEV, bountyAmount);
  await approveTx.wait();
  console.log("Approved", bountyAmount.toString(), "tokens for AIDev");

  // Create the task with the approved bounty.
  const contract = new ethers.Contract(ADDR.AIDEV, [
    "function createTask(string,uint256) public"
  ], signer);
  const tx = await contract.createTask(desc, bountyAmount);
  await tx.wait();
  alert("Task posted!");
  try {
    await loadTasks();
  } catch (err) { console.error(err); }
};

async function loadTasks() {
  const contract = new ethers.Contract(ADDR.AIDEV, [
    "function tasks(uint256) public view returns (string,address,uint256,bool)"
  ], provider);
  const list = document.getElementById("taskList");
  list.innerHTML = "";
  for (let i = 0; i < 20; i++) {
    try {
      const task = await contract.tasks(i);
      const html = `<div class="task"><strong>${task[0]}</strong><br>
        From: ${task[1]}<br>
        Bounty: ${ethers.utils.formatUnits(task[2], 18)} GOD<br>
        Status: ${task[3] ? "✅ Completed" : "🕒 Open"}<br>
        ${!task[3] ? `<button onclick="completeTask(${i})">Submit</button>` : ""}
        </div>`;
      list.innerHTML += html;
    } catch (err) {
      break;
    }
  }
}

window.completeTask = async function (id) {
  const contract = new ethers.Contract(ADDR.AIDEV, [
    "function markCompleted(uint256) public"
  ], signer);
  const tx = await contract.markCompleted(id);
  await tx.wait();
  alert("Task completed!");
  try {
    await loadTasks();
  } catch (err) { console.error(err); }
};

window.stake = async function () {
  try {
    const amt = document.getElementById("stakeAmount").value;
    if (!amt || Number(amt) <= 0) { 
      alert("Please enter a valid stake amount."); 
      return;
    }
    const value = ethers.utils.parseUnits(amt, 18);
    const token = new ethers.Contract(ADDR.TOKEN, [
      "function approve(address,uint256) public returns (bool)"
    ], signer);
    const stakeContract = new ethers.Contract(ADDR.STAKING, [
      "function stake(uint256) public"
    ], signer);
    // Approve tokens for staking.
    const approveTx = await token.approve(ADDR.STAKING, value);
    await approveTx.wait();
    console.log("Approve transaction mined:", approveTx.hash);
    // Stake tokens.
    const stakeTx = await stakeContract.stake(value);
    await stakeTx.wait();
    console.log("Stake transaction mined:", stakeTx.hash);
    alert("Staked!");
    await loadStakeInfo();
  } catch (err) {
    console.error("Staking error:", err);
    alert("Staking error: " + (err?.error?.message || err?.message || "Unknown error"));
  }
};

async function loadStakeInfo() {
  const contract = new ethers.Contract(ADDR.STAKING, [
    "function balances(address) view returns (uint256)",
    "function stakeTimestamps(address) view returns (uint256)"
  ], provider);
  const amount = await contract.balances(user);
  const timestamp = await contract.stakeTimestamps(user);
  console.log("Staked amount:", amount.toString(), "Timestamp:", timestamp.toString());
  const now = Math.floor(Date.now() / 1000);
  const age = now - timestamp;
  const readable = ethers.utils.formatUnits(amount, 18);
  document.getElementById("stakeStatus").innerText =
    `Staked: ${readable} GOD — since ${new Date(timestamp * 1000).toLocaleString()} (${age}s ago)`;
}

window.submitProposal = async function () {
  const text = document.getElementById("proposalText").value;
  const contract = new ethers.Contract(ADDR.GOVERNANCE, [
    "function createProposal(string) public"
  ], signer);
  const tx = await contract.createProposal(text);
  await tx.wait();
  alert("Proposal submitted!");
  try {
    await loadProposals();
  } catch (err) { console.error(err); }
};

async function loadProposals() {
  const contract = new ethers.Contract(ADDR.GOVERNANCE, [
    "function proposals(uint256) view returns (string,uint256,bool)"
  ], provider);
  const list = document.getElementById("proposalList");
  list.innerHTML = "";
  for (let i = 0; i < 20; i++) {
    try {
      const [desc, votes, executed] = await contract.proposals(i);
      list.innerHTML += `<div class="proposal">
        <strong>${desc}</strong><br>
        Votes: ${votes} | Executed: ${executed ? "✅" : "❌"}<br>
        <button onclick="vote(${i})">👍 Vote</button>
      </div>`;
    } catch (err) {
      break;
    }
  }
}

window.vote = async function (i) {
  const contract = new ethers.Contract(ADDR.GOVERNANCE, [
    "function vote(uint256) public"
  ], signer);
  try {
    const voteTx = await contract.vote(i);
    await voteTx.wait();
    alert("Vote submitted!");
    await loadProposals();
  } catch (err) {
    console.error("Voting error:", err);
    alert("Voting error: " + (err?.error?.message || err?.message || "Unknown error"));
  }
};
