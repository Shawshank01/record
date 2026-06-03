---
title: "Everyone should start using a better DNS"
description: "Although GDPR acts as a silent guardian for your personal data, taking additional steps yourself is still important for online privacy and security."
pubDate: 2026-06-03
tags:
  - Privacy
  - Security
  - DNS
  - Quad9
  - Vodafone
  - Ireland
---

Third year in Ireland.  
Moved houses three times.  
After the recent move, I received a lot of marketing SMS ads from Three.  
![jxl hint](/2026-05-27/three_ads.jxl)

This makes me wonder: Is Three tracking my location using the cell tower? It detected that I had moved to a new place in a residential area, assumed that I needed things for the new house, and sent me these messages.
This is just a conspiracy theory, and I have no way of proving whether my theory is correct. But it reminds me of writing this blog, which is to show you what [DNS](https://aws.amazon.com/route53/what-is-dns/) is and how your ISP can use it to know everything about you, and use this information to send you targeted marketing messages.

---

The Domain Name System (DNS) is a foundational protocol of the internet, serving as the primary mechanism for translating human-readable hostnames into machine-readable IP addresses. Think of it this way: instead of memorizing a string of numbers like 172.135.248.206, you only need to remember a meaningful phrase like ThisIsRían.com. The DNS server resolves that name into the correct IP address (172.135.248.206), guiding your browser directly to Rían's digital front door.

Generally speaking, this task is handled by your ISP by default. This means that your ISP knows exactly which websites you visited, down to the year, month, day, hour, minute and second, and they are more than happy to record it. Not only does recording this data allow them to rake in huge profits from advertisers, but the laws in most countries also require ISPs to retain this information for periods ranging from several months to several years. In the following section, I will use Irish law and Vodafone as examples.

While your ISP absolutely knows you visited a specific website, HTTPS encryption stops them from seeing everything you do on that site. With HTTPS, your data looks like this to your ISP:

| What your ISP CAN see | What your ISP CANNOT see |
| --- | --- |
| You visited `wikipedia.org` | The specific article you read (`/wiki/Domain_Name_System`) |
| You visited `amazon.com` | What you searched for, clicked on, or bought |
| Exactly when you connected and disconnected | The passwords or credit card info you typed |
| How much data you downloaded/uploaded | The text of messages you sent on encrypted apps |

For most people, that might not be a big deal. But if you truly don't want your ISP to know that you're visiting a home improvement website or a government agent to know that you were on Pornhub at 2 am, you should probably start using DoT or DoH provided by a legitimate DNS provider such as [Quad9](https://quad9.net/) instead of your ISP's default DNS, and here's why.

---

## Jurisdictional Governance and Data Protection Regimes
The structural divergence between public recursive resolvers and commercial Internet Service Providers (ISPs) is rooted in their organizational mandates and the legal jurisdictions that govern them. These factors dictate how subscriber metadata is processed, logged, and shielded from external surveillance.


| Governance Attribute | Quad9 Public DNS | Vodafone Ireland Default DNS |
| --- | --- | --- |
| Legal Entity Structure | Not-for-Profit Foundation | Commercial Telecommunications Provider |
| Corporate Domicile | Zürich, Switzerland | Dublin, Ireland |
| Primary Regulatory Oversight | Swiss Federal Data Protection and Information Commissioner (FDPIC) | Irish Data Protection Commission (DPC) |
| IP Address Logging Policy | Absolute zero-log policy for client IP addresses | Temporary and long-term logging of IP allocations |
| Mandatory Data Retention | Exempt from Swiss SPTA/TCA retention obligations for its resolver service | Legally bound to retain certain user/source data, generally around one year, with special retention orders possible |
| GDPR Compliance Pathway | Subject to Swiss law globally; GDPR representative in Hamburg for EEA users | Directly bound under EU GDPR and Irish ePrivacy Regulations |


### Quad9 and Swiss Geopolitical Engineering
Quad9 is incorporated as a non-profit foundation headquartered in Zürich, Switzerland. This corporate domicile was selected to place the entity under a legal system that strictly enforces individual privacy rights. Quad9 treats user IP addresses as personally identifiable information and aligns its privacy position with Swiss data-protection law and, for EEA users, the European Union’s General Data Protection Regulation (GDPR).
To secure its operations against state-compelled logging, Quad9 relies on Swiss legal protections and has published Swiss regulatory findings about its resolver service:
Exemption from the Telecommunications Act (TCA): The Swiss Federal Office of Communications confirmed that Quad9 is not a telecommunications service under the Swiss TCA, exempting the foundation from "Know Your Customer" (KYC) identity collection mandates.
Exemption from Surveillance Laws (SPTA): The Swiss Post and Telecommunications Surveillance Service ruled that the Federal Act on the Surveillance of Post and Telecommunications does not apply to Quad9. Consequently, Quad9 is not required to collect or retain metadata for law enforcement or intelligence agencies.
Global Swiss Data Protection Coverage: Quad9 says Swiss data protection law applies to users globally, while GDPR also applies to Quad9 users in the EEA.
Because Quad9 does not maintain a subscriber database or log client IP addresses, it possesses no metadata to yield. Any attempt by foreign agencies to compel data handover must go through a Mutual Legal Assistance Treaty (MLAT) evaluated by the Swiss Federal Office of Justice. If a government attempts to use national laws to force data collection, Quad9's operational charter mandates a complete shutdown of operations in that country, routing local queries to servers in nearby jurisdictions.

### Vodafone Ireland and Telecommunications Retention Mandates
Vodafone Ireland Limited operates as a commercial telecommunications provider under the laws of the Republic of Ireland and the EU. It manages a large network infrastructure under Autonomous System AS15502. Unlike public recursive resolvers, Vodafone is legally bound by the Communications (Retention of Data) (Amendment) Act 2022. This legislation was enacted to align Irish data retention laws with rulings from the Court of Justice of the European Union (CJEU), such as the Graham Dwyer murder conviction appeal, Digital Rights Ireland, and Tele2/Watson.
Under the Communications (Retention of Data) (Amendment) Act 2022, Vodafone Ireland must comply with retention obligations for certain categories of communications data:
Mandatory User and Internet Source Data Retention: Irish law requires service providers to retain certain user data and internet source data, such as data needed to identify the source of an internet communication, generally for around one year, with prescribed periods possible up to two years.
National Security Retention Orders: If the Minister for Justice identifies a serious threat to national security, a relevant judge can issue an order requiring service providers to retain specified Schedule 2 data for 12 months.
Targeted "Quick Freeze" Orders: Irish law enforcement agencies can obtain preservation and production orders to freeze metadata associated with a specific suspect.
When a subscriber queries Vodafone’s default DNS servers (such as the legacy 89.19.64.164 / 89.19.64.36 or dynamically assigned resolvers like 64.43.51.22), the request is sent in cleartext, exposing the queried domain name, timestamp, and subscriber IP address to the access network. Irish retention law should not be described as a clear statutory requirement to retain every DNS query, but plaintext ISP DNS still gives the provider the technical ability to observe those lookups.
Additionally, Vodafone Ireland has faced regulatory scrutiny regarding database management and subscriber preference handling. The Irish Data Protection Commission (DPC) has prosecuted Vodafone Ireland multiple times for unsolicited marketing communications under Regulation 13 of the ePrivacy Regulations, including documented cases in 2011, 2022, and 2023, with other reports noting prior convictions. These compliance failures underscore the privacy risks when sensitive subscriber data is managed by a commercial entity with marketing operations.

## Security Profiling, Content Blocking, and State Censorship
While recursive DNS resolvers are frequently used to enforce network security, the definition of "safety" differs significantly between a dedicated public security resolver and an ISP resolver subject to state court orders.

| Security & Filtering Dimension | Quad9 Public DNS (9.9.9.9) | Vodafone Ireland Default DNS |
| --- | --- | --- |
| Active Threat Prevention | Automatic blocking of malware, phishing, and C2 servers | None by default; requires a paid Secure Net subscription |
| Threat Intelligence Sourcing | Aggregated from 25+ security feeds | None on standard tiers |
| Copyright Intermediary Blocking | None; rejects copyright-based domain filtering | Compelled DNS-level blocklists for sites like The Pirate Bay |
| Dynamic Stream Interception | None | May be required where Vodafone is named in relevant copyright injunctions |
| Parental Content Control | Not customizable on the standard profile | Network-level custom filtering available via Secure Net |

### Cyber Threat Intelligence vs. Passive Routing
The default configuration of Quad9 (9.9.9.9) is designed for active threat mitigation. Quad9 blocks user connections to malicious domains at the DNS layer by aggregating real-time threat intelligence from 25+ independent threat intelligence providers, including the Swiss security center SWITCH. Some independent tests have reported block rates as high as about 97%, though results vary by test set and date. This filtering can prevent endpoints from communicating with malware distributors, phishing landing pages, and Command-and-Control (C2) servers. Quad9 performs this filtering automatically without charging subscription fees or requiring software installation on client devices.
By contrast, Vodafone Ireland’s default DNS servers operate as passive recursors. They do not provide native threat intelligence filtering to protect users from emerging cyber threats. If a Vodafone subscriber clicks an active phishing link while using default DNS, the resolver completes the lookup, leaving endpoint defense entirely to the local machine.

### ISP-Level Censorship and Legal Intermediary Blocking
While Vodafone's default DNS does not provide dynamic cyber threat filtering, it actively enforces state-mandated content blocking. As a licensed telecom intermediary, Vodafone Ireland is legally compelled to comply with High Court injunctions:
Copyright Infringement Blocks: Following a landmark legal action under "Irish SOPA" legislation, Vodafone was ordered by the Irish High Court to implement DNS-level blocking of indexers like The Pirate Bay and its corresponding mirror sites.
Dynamic Sports Streaming Blocks: Irish ISPs, including Vodafone where named in relevant orders, may be required to comply with copyright injunctions that block access to infringing streaming services.
Quad9 does not block sites for copyright enforcement, trademark disputes, or licensing contentions. Although Quad9 was temporarily subject to an interim injunction in Germany to block domains at the request of Sony Music, the Dresden Higher Regional Court ultimately ruled in Quad9's favor in December 2023, treating recursive DNS resolvers as neutral intermediaries that benefit from liability privileges under German and EU law. Its mandate remains strictly limited to cyber security threats.

### Vodafone Secure Net Add-On
To provide security filtering similar to public resolvers, Vodafone offers a paid network-level security subscription called Secure Net (Secure Net Home costs €2.99 per month, and Secure Net Mobile costs €1.99 per month). Secure Net is a network-level filtering product operated inside Vodafone’s network. Public Vodafone materials say it can analyse network traffic, block unsafe websites/downloads, and provide parental controls like age-appropriate content filtering, Bedtime schedules, and custom domain blocking, but they do not fully document the technical mechanisms used.
Because Secure Net operates inside Vodafone's transport loop, VPNs, encrypted proxy services, and some encrypted DNS configurations may bypass parts of its filtering, especially DNS-based filtering, depending on how the product implements detection. It may also be incompatible with browsers that utilize independent data compression.

## Cryptographic Protocols and Resolution Capabilities
Modern DNS design relies heavily on cryptographic transport security and performance optimization protocols. The architectural division between Quad9 and Vodafone Ireland reveals a stark contrast in their support for secure DNS standards.

| Technical Feature | Quad9 Public DNS | Vodafone Ireland Default DNS |
| --- | --- | --- |
| Standard Unencrypted DNS | Supported on UDP and TCP Port 53 | Default resolution protocol |
| DNS-over-TLS (DoT) | Supported on TCP Port 853 | Not supported on standard ISP servers |
| DNS-over-HTTPS (DoH) | Supported over HTTPS on port 443 | No public support documented for default customer resolvers |
| DNSSEC Validation | Supported and enforced on secured service profiles | Not verified from public Vodafone documentation |
| EDNS Client Subnet (ECS) | Stripped on 9.9.9.9; supported on 9.11.9.11 | Not verified from public Vodafone documentation |
| Extended DNS Errors (EDE) | Support varies by endpoint and implementation | Not verified from public Vodafone documentation |

### The Last-Mile Security Paradox
Standard DNS traffic is transmitted in cleartext over UDP or TCP port 53, making it vulnerable to on-path interception, eavesdropping, and tampering by network operators and middleboxes. To prevent this, secure transport protocols have been developed:
DNS-over-TLS (DoT): Wraps DNS queries inside a secure TLS session over dedicated TCP port 853. This encrypts name resolution traffic once configured at the OS, application, or router level.
DNS-over-HTTPS (DoH): Wraps DNS queries inside HTTPS, commonly using HTTP/2 over TLS/TCP 443 or HTTP/3 over QUIC/UDP 443. DoH blends in with standard web traffic, making it difficult for firewalls to block or inspect.
Quad9 supports both DoT and DoH across its main service profiles, providing robust encryption from the user's stub resolver directly to Quad9’s recursive resolver infrastructure.
Vodafone Ireland’s default name servers do not support incoming DoT or DoH connections. Devices utilizing the default ISP-assigned DNS send queries in cleartext, exposing every domain lookup to local network sniffers, transit providers, and state surveillance systems.
This creates The Last-Mile Security Paradox. If a user configures Quad9’s IP address (9.9.9.9) inside their router but leaves the connection unencrypted over standard port 53, the underlying ISP (Vodafone) can still inspect the DNS query payload. Because the DNS request travels in plaintext across Vodafone’s physical network, the ISP can technically record the queried domains. Therefore, to prevent ISP-path inspection of DNS lookups, users must configure secure DNS protocols like DoH or DoT on their devices to encrypt the traffic before it leaves the local network. This does not make browsing invisible to the ISP; it mainly protects the DNS lookup itself.

![jxl hint](/2026-05-27/vodafone-gigabox-dns-conf.jxl)
<p align="center"><em>Only change the settings on http://192.168.1.1/internet.html#sub=dns from the Gigabox doesn't save your privacy!</em></p>

## Infrastructure, Routing Latency, and Network Stability
DNS resolution performance directly impacts the responsiveness of web browsing, gaming startup handshakes, and application connection times. The mathematical expression for the total time required to establish a secure connection, *T*<sub>total</sub>, is:

<div style="text-align: center; margin: 1.5rem 0; font-size: 1.2rem; font-style: italic;">
  T<sub>total</sub> = T<sub>dns</sub> + T<sub>tcp</sub> + T<sub>tls</sub>
</div>

Where *T*<sub>dns</sub> represents DNS lookup latency, *T*<sub>tcp</sub> represents the TCP handshake duration, and *T*<sub>tls</sub> represents the cryptographic handshake time. A slow recursive resolver increases *T*<sub>dns</sub>, delaying the entire network handshake.
### Anycast Topology and Peering Infrastructure
Public DNS resolvers utilize Anycast routing, announcing the same IP address pool from multiple physical data centers globally. BGP routing protocols then direct the client's DNS query to the topologically nearest active node.

| Performance Variable | Quad9 Anycast System | Vodafone Internal ISP DNS |
| --- | --- | --- |
| Anycast Node Deployment | Globally distributed 230+ Resolver Clusters in over 110 countries | Concentrated within regional ISP network hubs |
| Peering Presence (Ireland) | Direct INEX peering via PCH AS42 | Local gateway peering within AS15502 |
| Uptime & Redundancy | High; queries automatically route to adjacent nodes if local servers fail | Dependent on the availability of local ISP recursors |
| Average Global Latency | ~21 ms (DNSPerf global average) | Highly dependent on the local subscriber loop |
| EDNS Client Subnet (ECS) | Disabled on standard tier; may cause sub-optimal CDN routing | Not verified from public Vodafone documentation |

Quad9 partners with Packet Clearing House (PCH), which maintains DNS nodes across many Internet Exchange Points globally. PCH’s AS42 joined the Irish Internet Association Exchange (INEX) in 2009. It peers with a 10 Gbps port at Equinix DB2 Kilcarbery, Dublin, assigning IP addresses 185.6.36.60 and 2001:7f8:18::60. This can allow Irish networks with favourable routing or peering to reach Quad9 with very low latency.
Vodafone Ireland (AS15502) handles massive IP space. Because its default recursive servers sit directly inside the subscriber's broadband access path, they can resolve cached records with minimal latency. However, Vodafone's DNS relies on localized routing and lacks the globally distributed redundancy of a multi-node anycast network. If a local recursor fails, standard fallback relies on the secondary server, which may still be affected by local network congestion.
Standard Quad9 9.9.9.9 strips ECS to protect privacy, which can cause some CDNs to make less optimal routing decisions. Vodafone IE’s DNS may provide strong local routing for content providers, but its ECS behaviour is not verified from public Vodafone documentation.

---

## How to Actually Use Quad9 with DoT or DoH

Quad9's official documentation is available at [docs.quad9.net](https://docs.quad9.net/). Their recommended secure service is `9.9.9.9`, which provides DNSSEC validation and threat blocking. But just like I mentioned above, simply using Quad9 over plain port 53 on your router will not hide DNS lookups from your ISP. To protect the DNS query itself, use DoH or DoT.

For encrypted DNS, the important hostname is:

```text
dns.quad9.net
```

If your device does not support DoH or DoT natively, such as some ISP routers, using Quad9's secure resolver addresses is still useful for DNSSEC validation and threat blocking, but it will not encrypt the DNS traffic:

```text
IPv4: 9.9.9.9, 149.112.112.112
IPv6: 2620:fe::fe, 2620:fe::9
```

For most people, **DoH is the safer default choice on laptops and phones** because it is less likely to be blocked on guest Wi-Fi. **DoT is great on networks you control**, such as your home Wi-Fi or a router you manage.

### Android 9 and later

Android has built-in DNS-over-TLS support through **Private DNS**:

1. Open `Settings`.
2. Search for `Private DNS`.
3. Select `Private DNS provider hostname`.
4. Enter `dns.quad9.net`.
5. Tap `Save`.

Quad9 notes that Android's Private DNS will not be used while a VPN is active, and it may conflict with the Quad9 Connect app if that app is installed and enabled.

### iPhone, iPad, and macOS

For iOS 14+ and macOS Big Sur+, Quad9 provides downloadable encrypted DNS profiles. Their docs recommend **DNS-over-HTTPS for most users**, especially on guest Wi-Fi or networks you do not control. DNS-over-TLS is better suited to networks where you know port `853` is allowed.

The basic process is:

1. Open Quad9's official setup guide in **Safari**.
2. Download the `9.9.9.9` **HTTPS** profile for DoH, or the `9.9.9.9` **TLS** profile for DoT.
3. Open `Settings` / `System Settings` and install the downloaded profile.
4. Remember that Apple's encrypted DNS profiles expire; Quad9's current documentation says the profiles expire on **19 January 2027**, so future-you may need to install a fresh one.

Quad9 also notes that iCloud Private Relay, many VPN clients, and tools like Little Snitch may ignore or override the DNS profile.

### Windows 11

Windows 11 can use DNS-over-HTTPS directly from network settings:

1. Open `Network and Internet Settings`.
2. Select your active `Wi-Fi` or `Ethernet` connection.
3. Click `Edit` next to `DNS server assignment`.
4. Change it from `Automatic (DHCP)` to `Manual`.
5. Enable `IPv4` and enter:
   - Preferred DNS: `9.9.9.9`
   - Alternate DNS: `149.112.112.112`
6. Set `DNS over HTTPS` to `On (automatic template)` for both.
7. If you use IPv6, also enter:
   - Preferred DNS: `2620:fe::fe`
   - Alternate DNS: `2620:fe::9`
8. Save the settings.

Quad9's Windows guide also warns that VPNs usually ignore system DNS settings. If you use a VPN, configure Quad9 inside the VPN client's `Custom DNS` settings instead.

### Check if it worked

After setting it up, visit [on.quad9.net](https://on.quad9.net/).

Quad9 uses this page to confirm whether your device is using Quad9. On Windows, Quad9's documentation also suggests checking the protocol with PowerShell:

```powershell
Resolve-DnsName -Type txt proto.on.quad9.net.
```

If the result says `doh`, congratulations: your DNS is wearing a tiny encrypted trench coat.

> TIP:  
> if you're using a VPN, make sure to configure Quad9 inside the VPN client's `Custom DNS` settings instead of relying on the system DNS settings. Otherwise, you may see DNS traffic from both your VPN and Quad9, which can look like a DNS leak to privacy checkers or connection logs.

![jxl hint](/2026-05-27/VPN-conflict.jxl)

This happens on MacOS and Android. But on iOS, it seems only the VPN DNS is used, not the system DNS, even with Quad9's profile installed.

And if it does not work the first time, don't panic. DNS is just the internet's phonebook, and like every phonebook, sometimes it has been left under a router, behind a sofa, guarded by a very confused cat.

---

### One last caveat
Encrypted DNS is not the same thing as full browsing anonymity. Even with DoH or DoT, your ISP can still see destination IP addresses, connection timing, traffic volume, and sometimes the hostname exposed through TLS metadata such as SNI. [Encrypted Client Hello (ECH)](https://blog.cloudflare.com/announcing-encrypted-client-hello/) is designed to hide more of that TLS handshake metadata, but it only works when both your browser and the website/CDN support it. You can check whether your browser is using ECH with [Cloudflare's trace page](https://crypto.cloudflare.com/cdn-cgi/trace) or [test.defo.ie](https://test.defo.ie/).

But this is for another story.
